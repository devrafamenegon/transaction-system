import { Controller, Get, Query } from '@nestjs/common';
import { TransactionLogsService } from './transaction-logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';
import { TransactionLog } from './entities/transaction-log.entity';

@Controller('transaction-logs')
export class TransactionLogsController {
  constructor(private readonly transactionLogsService: TransactionLogsService) {}

  @Get()
  async queryLogs(@Query() queryParams: QueryLogsDto): Promise<TransactionLog[]> {
    return this.transactionLogsService.queryLogs(queryParams);
  }

  @Get('by-account')
  async findByAccountNumber(
    @Query('accountNumber') accountNumber: string,
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByAccountNumber(accountNumber);
  }
}