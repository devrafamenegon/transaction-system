import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Transaction, TransactionType } from "./entities/transaction.entity";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { AccountsService } from "../accounts/accounts.service";
import { TransactionRepository } from "./repositories/transaction.repository";
import { AccountRepository } from "../accounts/repositories/account.repository";
import { TransactionLogsService } from "../transaction-logs/transaction-logs.service";
import { LogStatus } from "../transaction-logs/entities/transaction-log.entity";
import { LoggerService } from "../common/logger/logger.service";
import { AppError, DatabaseError } from "../common/types/error.types";
import { AppException } from "../common/exceptions/app.exception";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountsService: AccountsService,
    private readonly transactionLogsService: TransactionLogsService,
    private readonly logger: LoggerService,
    private readonly dataSource: DataSource
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const sourceAccount = await this.accountsService.findById(
        createTransactionDto.sourceAccountId
      );
      let destinationAccount = null;

      if (createTransactionDto.type === TransactionType.TRANSFER) {
        if (!createTransactionDto.destinationAccountId) {
          throw new BadRequestException(
            "Destination account is required for transfers"
          );
        }
        destinationAccount = await this.accountsService.findById(
          createTransactionDto.destinationAccountId
        );
      }

      const previousSourceBalance = sourceAccount.balance;
      let previousDestBalance = destinationAccount?.balance;

      this.logger.debug(
        `Starting transaction: ${createTransactionDto.type} - Amount: ${createTransactionDto.amount}`,
        "TransactionsService"
      );

      if (
        (createTransactionDto.type === TransactionType.WITHDRAWAL ||
          createTransactionDto.type === TransactionType.TRANSFER) &&
        sourceAccount.balance < createTransactionDto.amount
      ) {
        throw new BadRequestException("Insufficient funds");
      }

      switch (createTransactionDto.type) {
        case TransactionType.DEPOSIT:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            createTransactionDto.amount,
            false
          );
          break;
        case TransactionType.WITHDRAWAL:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            createTransactionDto.amount,
            true
          );
          break;
        case TransactionType.TRANSFER:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            createTransactionDto.amount,
            true
          );
          await this.accountRepository.updateBalance(
            destinationAccount!.id,
            createTransactionDto.amount,
            false
          );
          break;
      }

      const transaction = await this.transactionRepository.create({
        sourceAccount,
        destinationAccount,
        amount: createTransactionDto.amount,
        type: createTransactionDto.type,
        description: createTransactionDto.description,
      });

      const updatedSourceAccount = await this.accountsService.findById(
        sourceAccount.id
      );
      await this.transactionLogsService.createLog(
        transaction,
        sourceAccount,
        previousSourceBalance,
        updatedSourceAccount.balance,
        LogStatus.SUCCESS
      );

      if (destinationAccount) {
        const updatedDestAccount = await this.accountsService.findById(
          destinationAccount.id
        );
        await this.transactionLogsService.createLog(
          transaction,
          destinationAccount,
          previousDestBalance!,
          updatedDestAccount.balance,
          LogStatus.SUCCESS
        );
      }

      await queryRunner.commitTransaction();

      this.logger.logTransaction(transaction.id, "SUCCESS", {
        type: transaction.type,
        amount: transaction.amount,
        sourceAccount: sourceAccount.accountNumber,
        destinationAccount: destinationAccount?.accountNumber,
      });

      return transaction;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      const err = error as AppError;

      this.logger.error(
        `Transaction failed: ${err.message}`,
        err.stack,
        "TransactionsService"
      );

      if (err instanceof BadRequestException) {
        throw err;
      }

      if ((err as DatabaseError).code?.startsWith("23")) {
        throw new AppException(
          "Database constraint violation",
          500,
          "TRANSACTION_DB_ERROR",
          { detail: (err as DatabaseError).detail }
        );
      }

      const sourceAccount = await this.accountsService.findById(
        createTransactionDto.sourceAccountId
      );
      const transaction =
        await this.transactionRepository.create(createTransactionDto);

      await this.transactionLogsService.createLog(
        transaction,
        sourceAccount,
        sourceAccount.balance,
        sourceAccount.balance,
        LogStatus.FAILED,
        err.message
      );

      this.logger.logTransaction(transaction.id, "FAILED", {
        error: err.message,
        type: createTransactionDto.type,
        amount: createTransactionDto.amount,
        sourceAccountId: createTransactionDto.sourceAccountId,
      });

      throw new AppException(
        "Failed to process transaction",
        500,
        "TRANSACTION_FAILED",
        {
          type: createTransactionDto.type,
          amount: createTransactionDto.amount,
          error: err.message,
        }
      );
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Transaction[]> {
    try {
      this.logger.debug("Retrieving all transactions", "TransactionsService");
      return await this.transactionRepository.findAll();
    } catch (error: any) {
      const err = error as AppError;
      this.logger.error(
        `Failed to retrieve transactions: ${err.message}`,
        err.stack,
        "TransactionsService"
      );
      throw new AppException(
        "Failed to retrieve transactions",
        500,
        "TRANSACTION_FETCH_ERROR"
      );
    }
  }

  async findById(id: string): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findById(id);

      if (!transaction) {
        this.logger.warn(`Transaction not found: ${id}`, "TransactionsService");
        throw new NotFoundException("Transaction not found");
      }

      return transaction;
    } catch (error: any) {
      const err = error as AppError;

      if (err instanceof NotFoundException) {
        throw err;
      }

      this.logger.error(
        `Failed to retrieve transaction: ${err.message}`,
        err.stack,
        "TransactionsService"
      );

      throw new AppException(
        "Failed to retrieve transaction",
        500,
        "TRANSACTION_FETCH_ERROR",
        { id }
      );
    }
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    try {
      this.logger.debug(
        `Retrieving transactions for account: ${accountId}`,
        "TransactionsService"
      );
      return await this.transactionRepository.findByAccountId(accountId);
    } catch (error: any) {
      const err = error as AppError;
      this.logger.error(
        `Failed to retrieve account transactions: ${err.message}`,
        err.stack,
        "TransactionsService"
      );
      throw new AppException(
        "Failed to retrieve account transactions",
        500,
        "TRANSACTION_FETCH_ERROR",
        { accountId }
      );
    }
  }
}
