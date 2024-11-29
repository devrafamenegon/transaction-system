import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionRepository } from "./repositories/transaction.repository";
import { Transaction } from "./entities/transaction.entity";
import { AccountsModule } from "../accounts/accounts.module";
import { TransactionLogsModule } from "../transaction-logs/transaction-logs.module";
import { TransactionProcessorService } from "./services/transaction-processor.service";
import { TransactionValidatorService } from "./services/transaction-validator.service";
import { LoggerModule } from "../common/logger/logger.module";
import { TransactionQueue } from "./queues/transaction.queue";
import { TransactionProcessor } from "./processors/transaction.processor";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    BullModule.registerQueue({
      name: "transactions",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
    AccountsModule,
    TransactionLogsModule,
    LoggerModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRepository,
    TransactionProcessorService,
    TransactionValidatorService,
    TransactionQueue,
    TransactionProcessor,
  ],
  exports: [TransactionsService, TransactionRepository],
})
export class TransactionsModule {}
