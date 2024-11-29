import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "../entities/account.entity";
import { LoggerService } from "../../common/logger/logger.service";

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService
  ) {}

  async findByNumber(accountNumber: string): Promise<Account | null> {
    this.logger.debug(
      `Finding account by number: ${accountNumber}`,
      "AccountRepository"
    );

    return this.repository
      .createQueryBuilder("account")
      .leftJoinAndSelect("account.users", "users")
      .where("account.accountNumber = :accountNumber", { accountNumber })
      .getOne();
  }

  async findById(id: string): Promise<Account | null> {
    this.logger.debug(`Finding account by ID: ${id}`, "AccountRepository");

    return this.repository
      .createQueryBuilder("account")
      .leftJoinAndSelect("account.users", "users")
      .where("account.id = :id", { id })
      .getOne();
  }

  async create(accountData: Partial<Account>): Promise<Account> {
    this.logger.debug(
      `Creating new account: ${JSON.stringify(accountData)}`,
      "AccountRepository"
    );

    const account = this.repository.create(accountData);
    return this.repository.save(account);
  }

  async save(account: Account): Promise<Account> {
    this.logger.debug(`Saving account: ${account.id}`, "AccountRepository");
    return this.repository.save(account);
  }

  async findByUserId(userId: string): Promise<Account[]> {
    this.logger.debug(
      `Finding accounts for user: ${userId}`,
      "AccountRepository"
    );

    return this.repository
      .createQueryBuilder("account")
      .leftJoinAndSelect("account.users", "users")
      .where("users.id = :userId", { userId })
      .getMany();
  }

  async updateBalance(
    accountId: string,
    amount: number,
    isDebit: boolean
  ): Promise<Account> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager
        .createQueryBuilder(Account, "account")
        .leftJoinAndSelect("account.users", "users")
        .where("account.id = :id", { id: accountId })
        .setLock("pessimistic_write")
        .getOne();

      if (!account) {
        throw new Error("Account not found");
      }

      account.balance = isDebit
        ? account.balance - amount
        : account.balance + amount;
      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      this.logger.debug(
        `Updated balance for account ${accountId}: ${isDebit ? "debit" : "credit"} ${amount}`,
        "AccountRepository"
      );

      return savedAccount;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Failed to update balance for account ${accountId}: ${error.message}`,
        error.stack,
        "AccountRepository"
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
