import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "../entities/account.entity";
import { LoggerService } from "../../common/logger/logger.service";
import { DatabaseException } from "../../common/exceptions/database.exception";

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
    await queryRunner.startTransaction("SERIALIZABLE");

    try {
      // Get the account with a lock
      const account = await queryRunner.manager
        .createQueryBuilder(Account, "account")
        .setLock("pessimistic_write")
        .where("account.id = :id", { id: accountId })
        .getOne();

      if (!account) {
        throw new DatabaseException("Account not found", "ACCOUNT_NOT_FOUND", {
          accountId,
        });
      }

      // Calculate new balance
      const currentBalance = Number(account.balance);
      const transactionAmount = Number(amount);
      const newBalance = isDebit
        ? currentBalance - transactionAmount
        : currentBalance + transactionAmount;

      // Update account with new balance and increment version
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Account)
        .set({
          balance: newBalance,
          version: () => '"version" + 1',
        })
        .where("id = :id AND version = :version", {
          id: accountId,
          version: account.version,
        })
        .execute();

      if (result.affected === 0) {
        throw new DatabaseException(
          "Concurrent update detected",
          "CONCURRENT_UPDATE",
          { accountId }
        );
      }

      // Get updated account
      const updatedAccount = await queryRunner.manager
        .createQueryBuilder(Account, "account")
        .where("account.id = :id", { id: accountId })
        .getOne();

      await queryRunner.commitTransaction();

      this.logger.debug(
        `Updated balance for account ${accountId}: ${isDebit ? "debit" : "credit"} ${amount}. New balance: ${updatedAccount!.balance}`,
        "AccountRepository"
      );

      return updatedAccount!;
    } catch (error: any) {
      await queryRunner.rollbackTransaction();

      this.logger.error(
        `Failed to update balance for account ${accountId}: ${error.message}`,
        error.stack,
        "AccountRepository"
      );

      if (error instanceof DatabaseException) {
        throw error;
      }

      throw new DatabaseException(
        "Failed to update account balance",
        "BALANCE_UPDATE_FAILED",
        {
          accountId,
          error: error.message,
        }
      );
    } finally {
      await queryRunner.release();
    }
  }
}
