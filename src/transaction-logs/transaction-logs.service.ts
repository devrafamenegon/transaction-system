import { Injectable } from "@nestjs/common";
import { TransactionLogRepository } from "./repositories/transaction-log.repository";
import { TransactionLog, LogStatus } from "./entities/transaction-log.entity";
import { QueryLogsDto } from "./dto/query-logs.dto";
import { Account } from "../accounts/entities/account.entity";
import { Transaction } from "../transactions/entities/transaction.entity";
import { LoggerService } from "../common/logger/logger.service";

@Injectable()
export class TransactionLogsService {
  constructor(
    private readonly transactionLogRepository: TransactionLogRepository,
    private readonly logger: LoggerService
  ) {}

  async createLog(
    transaction: Transaction,
    account: Account,
    previousBalance: number,
    newBalance: number,
    status: LogStatus,
    errorMessage?: string
  ): Promise<TransactionLog> {
    this.logger.debug(
      `Creating transaction log for transaction ${transaction.id}`,
      "TransactionLogsService"
    );

    const metadata = JSON.stringify({
      transactionType: transaction.type,
      timestamp: new Date().toISOString(),
      description: transaction.description,
    });

    const log = await this.transactionLogRepository.create({
      transaction,
      account,
      transactionId: transaction.id,
      accountId: account.id,
      previousBalance,
      newBalance,
      status,
      errorMessage,
      metadata,
    });

    this.logger.debug(
      `Transaction log created: ${JSON.stringify({
        logId: log.id,
        transactionId: transaction.id,
        status,
        balanceChange: newBalance - previousBalance,
      })}`,
      "TransactionLogsService"
    );

    return log;
  }

  async queryLogs(queryParams: QueryLogsDto): Promise<TransactionLog[]> {
    this.logger.debug(
      `Querying logs with params: ${JSON.stringify(queryParams)}`,
      "TransactionLogsService"
    );

    const logs = await this.transactionLogRepository.queryLogs(queryParams);

    this.logger.debug(
      `Found ${logs.length} logs matching query parameters`,
      "TransactionLogsService"
    );

    return logs;
  }

  async findByAccountNumber(accountNumber: string): Promise<TransactionLog[]> {
    this.logger.debug(
      `Retrieving logs for account: ${accountNumber}`,
      "TransactionLogsService"
    );

    const logs =
      await this.transactionLogRepository.findByAccountNumber(accountNumber);

    this.logger.debug(
      `Found ${logs.length} logs for account ${accountNumber}`,
      "TransactionLogsService"
    );

    return logs;
  }
}
