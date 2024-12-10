import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule, BullModuleOptions } from "@nestjs/bull";
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
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    BullModule.registerQueueAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      name: "transactions",
      useFactory: (configService: ConfigService): BullModuleOptions => ({
        defaultJobOptions: {
          attempts: configService.get("queue.attempts", {
            infer: true,
          }),
          backoff: {
            type: "exponential",
            delay: configService.get("queue.backoffDelay", {
              infer: true,
            }),
          },
          removeOnComplete: configService.get("queue.removeOnComplete", {
            infer: true,
          }),
          removeOnFail: configService.get("queue.removeOnFail", {
            infer: true,
          }),
        },
      }),
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
