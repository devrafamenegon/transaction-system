import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionLogsController } from './transaction-logs.controller';
import { TransactionLogsService } from './transaction-logs.service';
import { TransactionLogRepository } from './repositories/transaction-log.repository';
import { TransactionLog } from './entities/transaction-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionLog])],
  controllers: [TransactionLogsController],
  providers: [TransactionLogsService, TransactionLogRepository],
  exports: [TransactionLogsService],
})
export class TransactionLogsModule {}