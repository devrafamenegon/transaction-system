import { Injectable } from "@nestjs/common";
import { TransactionLogRepository } from "./repositories/transaction-log.repository";
import { TransactionLog, LogStatus } from "./entities/transaction-log.entity";
import { QueryLogsDto } from "./dto/query-logs.dto";
import { Account } from "../accounts/entities/account.entity";
import { Transaction } from "../transactions/entities/transaction.entity";

@Injectable()
export class TransactionLogsService {
  constructor(
    private readonly transactionLogRepository: TransactionLogRepository
  ) {}

  async createLog(
    transaction: Transaction,
    account: Account,
    previousBalance: number,
    newBalance: number,
    status: LogStatus,
    errorMessage?: string
  ): Promise<TransactionLog> {
    const metadata = JSON.stringify({
      transactionType: transaction.type,
      timestamp: new Date().toISOString(),
      description: transaction.description,
    });

    return this.transactionLogRepository.create({
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
  }

  async queryLogs(queryParams: QueryLogsDto): Promise<TransactionLog[]> {
    return this.transactionLogRepository.queryLogs(queryParams);
  }

  async findByAccountNumber(accountNumber: string): Promise<TransactionLog[]> {
    return this.transactionLogRepository.findByAccountNumber(accountNumber);
  }
}
