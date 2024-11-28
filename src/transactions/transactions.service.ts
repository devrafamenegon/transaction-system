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

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountsService: AccountsService,
    private readonly transactionLogsService: TransactionLogsService,
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

        if (!destinationAccount.id) {
          throw new NotFoundException("Destination account not found");
        }
      }

      const previousSourceBalance = sourceAccount.balance;
      let previousDestBalance = destinationAccount?.balance;

      // Validate balance for withdrawals and transfers
      if (
        (createTransactionDto.type === TransactionType.WITHDRAWAL ||
          createTransactionDto.type === TransactionType.TRANSFER) &&
        sourceAccount.balance < createTransactionDto.amount
      ) {
        throw new BadRequestException("Insufficient funds");
      }

      // Update balances using repository methods
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

      // Create and save transaction
      const transaction = await this.transactionRepository.create({
        sourceAccount,
        destinationAccount,
        amount: createTransactionDto.amount,
        type: createTransactionDto.type,
        description: createTransactionDto.description,
      });

      // Create transaction logs
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
      return transaction;
    } catch (err) {
      await queryRunner.rollbackTransaction();

      // Log failed transaction
      if (err instanceof Error) {
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
      }

      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.findAll();
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return transaction;
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByAccountId(accountId);
  }
}
