import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionRepository } from "./repositories/transaction.repository";
import { Transaction } from "./entities/transaction.entity";
import { AccountsModule } from "../accounts/accounts.module";
import { TransactionLogsModule } from "../transaction-logs/transaction-logs.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    AccountsModule,
    TransactionLogsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionRepository],
})
export class TransactionsModule {}
