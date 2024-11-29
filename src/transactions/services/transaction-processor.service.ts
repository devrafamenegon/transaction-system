import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { LoggerService } from "../../common/logger/logger.service";
import { Account } from "../../accounts/entities/account.entity";
import { Transaction, TransactionType } from "../entities/transaction.entity";
import { AccountRepository } from "../../accounts/repositories/account.repository";
import { TransactionRepository } from "../repositories/transaction.repository";
import { TransactionLogsService } from "../../transaction-logs/transaction-logs.service";
import { LogStatus } from "../../transaction-logs/entities/transaction-log.entity";

@Injectable()
export class TransactionProcessorService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionLogsService: TransactionLogsService,
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService
  ) {}

  async processTransaction(
    sourceAccount: Account,
    destinationAccount: Account | null,
    amount: number,
    type: TransactionType,
    description?: string
  ): Promise<Transaction> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      this.logger.debug(
        `Processing ${type} transaction: Amount ${amount} from account ${sourceAccount.id}`,
        "TransactionProcessor"
      );

      const previousSourceBalance = sourceAccount.balance;
      const previousDestBalance = destinationAccount?.balance;

      // Update account balances
      switch (type) {
        case TransactionType.DEPOSIT:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            amount,
            false
          );
          break;
        case TransactionType.WITHDRAWAL:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            amount,
            true
          );
          break;
        case TransactionType.TRANSFER:
          await this.accountRepository.updateBalance(
            sourceAccount.id,
            amount,
            true
          );
          if (destinationAccount) {
            await this.accountRepository.updateBalance(
              destinationAccount.id,
              amount,
              false
            );
          }
          break;
      }

      // Create transaction record
      const transaction = await this.transactionRepository.create({
        sourceAccount,
        destinationAccount,
        amount,
        type,
        description,
      });

      // Create transaction logs
      const updatedSourceAccount = await this.accountRepository.findById(
        sourceAccount.id
      );
      await this.transactionLogsService.createLog(
        transaction,
        sourceAccount,
        previousSourceBalance,
        updatedSourceAccount!.balance,
        LogStatus.SUCCESS
      );

      if (destinationAccount) {
        const updatedDestAccount = await this.accountRepository.findById(
          destinationAccount.id
        );
        await this.transactionLogsService.createLog(
          transaction,
          destinationAccount,
          previousDestBalance!,
          updatedDestAccount!.balance,
          LogStatus.SUCCESS
        );
      }

      await queryRunner.commitTransaction();

      this.logger.debug(
        `Transaction completed successfully: ${JSON.stringify({
          id: transaction.id,
          type,
          amount,
          sourceAccount: sourceAccount.id,
          destinationAccount: destinationAccount?.id,
        })}`,
        "TransactionProcessor"
      );

      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
