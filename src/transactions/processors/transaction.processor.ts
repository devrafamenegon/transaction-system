import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { LoggerService } from "../../common/logger/logger.service";
import { TransactionProcessorService } from "../services/transaction-processor.service";
import { AccountsService } from "../../accounts/accounts.service";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import { TransactionValidatorService } from "../services/transaction-validator.service";

@Processor("transactions")
export class TransactionProcessor {
  constructor(
    private readonly transactionProcessor: TransactionProcessorService,
    private readonly accountsService: AccountsService,
    private readonly transactionValidator: TransactionValidatorService,
    private readonly logger: LoggerService
  ) {}

  @Process("process-transaction")
  async processTransaction(job: Job<CreateTransactionDto>) {
    this.logger.debug(
      `Processing transaction job ${job.id}: ${JSON.stringify(job.data)}`,
      "TransactionProcessor"
    );

    try {
      // Get accounts
      const sourceAccount = await this.accountsService.findById(
        job.data.sourceAccountId
      );

      let destinationAccount = null;
      if (job.data.destinationAccountId) {
        destinationAccount = await this.accountsService.findById(
          job.data.destinationAccountId
        );
      }

      // Validate transaction
      this.transactionValidator.validateTransaction(
        job.data,
        sourceAccount,
        destinationAccount
      );

      // Process transaction
      const result = await this.transactionProcessor.processTransaction(
        sourceAccount,
        destinationAccount,
        job.data.amount,
        job.data.type,
        job.data.description
      );

      this.logger.debug(
        `Transaction job ${job.id} completed successfully`,
        "TransactionProcessor"
      );

      return result;
    } catch (error: any) {
      this.logger.error(
        `Transaction job ${job.id} failed: ${error.message}`,
        error.stack,
        "TransactionProcessor"
      );
      throw error;
    }
  }
}
