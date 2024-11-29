import { Injectable } from "@nestjs/common";
import { Transaction } from "./entities/transaction.entity";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { TransactionRepository } from "./repositories/transaction.repository";
import { LoggerService } from "../common/logger/logger.service";
import { AppException } from "../common/exceptions/app.exception";
import { TransactionQueue } from "./queues/transaction.queue";
import {
  QueueJobResponse,
  JobStatus,
} from "./interfaces/queue-response.interface";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly transactionQueue: TransactionQueue,
    private readonly logger: LoggerService
  ) {}

  async create(
    createTransactionDto: CreateTransactionDto
  ): Promise<QueueJobResponse> {
    try {
      this.logger.debug(
        `Creating transaction request: ${JSON.stringify(createTransactionDto)}`,
        "TransactionsService"
      );

      return await this.transactionQueue.addTransaction(createTransactionDto);
    } catch (error: any) {
      this.logger.error(
        `Failed to create transaction: ${error.message}`,
        error.stack,
        "TransactionsService"
      );
      throw error;
    }
  }

  async getTransactionStatus(jobId: string): Promise<JobStatus> {
    return this.transactionQueue.getJobStatus(jobId);
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionRepository.findAll();
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);

    if (!transaction) {
      throw new AppException(
        "Transaction not found",
        404,
        "TRANSACTION_NOT_FOUND",
        { id }
      );
    }

    return transaction;
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.transactionRepository.findByAccountId(accountId);
  }
}
