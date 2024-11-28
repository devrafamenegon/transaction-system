import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { TransactionLog } from "../entities/transaction-log.entity";
import { QueryLogsDto } from "../dto/query-logs.dto";

@Injectable()
export class TransactionLogRepository {
  constructor(
    @InjectRepository(TransactionLog)
    private readonly repository: Repository<TransactionLog>
  ) {}

  async create(logData: Partial<TransactionLog>): Promise<TransactionLog> {
    const log = this.repository.create(logData);
    return this.repository.save(log);
  }

  async findByAccountNumber(accountNumber: string): Promise<TransactionLog[]> {
    return this.repository.find({
      where: {
        account: {
          accountNumber,
        },
      },
      relations: ["transaction", "account"],
      order: { createdAt: "DESC" },
    });
  }

  async queryLogs(queryParams: QueryLogsDto): Promise<TransactionLog[]> {
    const query = this.repository
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.transaction", "transaction")
      .leftJoinAndSelect("log.account", "account")
      .orderBy("log.createdAt", "DESC");

    if (queryParams.accountNumber) {
      query.andWhere("account.accountNumber = :accountNumber", {
        accountNumber: queryParams.accountNumber,
      });
    }

    if (queryParams.startDate && queryParams.endDate) {
      query.andWhere("log.createdAt BETWEEN :startDate AND :endDate", {
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });
    }

    return query.getMany();
  }
}
