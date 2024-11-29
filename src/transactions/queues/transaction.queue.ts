import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { LoggerService } from "../../common/logger/logger.service";
import {
  JobStatus,
  QueueJobResponse,
} from "../interfaces/queue-response.interface";

@Injectable()
export class TransactionQueue {
  constructor(
    @InjectQueue("transactions") private readonly transactionsQueue: Queue,
    private readonly logger: LoggerService
  ) {}

  async addTransaction(
    transactionDto: CreateTransactionDto
  ): Promise<QueueJobResponse> {
    this.logger.debug(
      `Adding transaction to queue: ${JSON.stringify(transactionDto)}`,
      "TransactionQueue"
    );

    const job = await this.transactionsQueue.add(
      "process-transaction",
      transactionDto,
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    );

    this.logger.debug(
      `Transaction added to queue with job ID: ${job.id}`,
      "TransactionQueue"
    );

    return { jobId: job.id.toString() };
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.transactionsQueue.getJob(jobId);

    if (!job) {
      return { status: "not_found" };
    }

    const state = await job.getState();

    const status: JobStatus = {
      status: state as JobStatus["status"],
      data: job.returnvalue,
    };

    if (state === "failed") {
      status.error = job.failedReason;
    }

    return status;
  }
}
