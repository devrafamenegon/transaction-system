import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction } from "../entities/transaction.entity";
import { LoggerService } from "../../common/logger/logger.service";

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
    private readonly logger: LoggerService
  ) {}

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    this.logger.debug(
      `Creating new transaction: ${JSON.stringify(transactionData)}`,
      "TransactionRepository"
    );
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    this.logger.debug(
      `Finding transaction by ID: ${id}`,
      "TransactionRepository"
    );
    return this.repository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.sourceAccount", "sourceAccount")
      .leftJoinAndSelect("transaction.destinationAccount", "destinationAccount")
      .where("transaction.id = :id", { id })
      .getOne();
  }

  async findAll(): Promise<Transaction[]> {
    this.logger.debug("Finding all transactions", "TransactionRepository");
    return this.repository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.sourceAccount", "sourceAccount")
      .leftJoinAndSelect("transaction.destinationAccount", "destinationAccount")
      .orderBy("transaction.createdAt", "DESC")
      .getMany();
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    this.logger.debug(
      `Finding transactions for account: ${accountId}`,
      "TransactionRepository"
    );
    return this.repository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.sourceAccount", "sourceAccount")
      .leftJoinAndSelect("transaction.destinationAccount", "destinationAccount")
      .where("sourceAccount.id = :accountId", { accountId })
      .orWhere("destinationAccount.id = :accountId", { accountId })
      .orderBy("transaction.createdAt", "DESC")
      .getMany();
  }
}
