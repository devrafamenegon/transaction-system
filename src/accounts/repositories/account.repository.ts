import { Injectable } from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "../entities/account.entity";

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
    private readonly dataSource: DataSource
  ) {}

  async findByNumber(accountNumber: string): Promise<Account | null> {
    return this.repository.findOne({
      where: { accountNumber },
      relations: ["users"],
    });
  }

  async findById(id: string): Promise<Account | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["users"],
    });
  }

  async create(accountData: Partial<Account>): Promise<Account> {
    const account = this.repository.create(accountData);
    return this.repository.save(account);
  }

  async save(account: Account): Promise<Account> {
    return this.repository.save(account);
  }

  async findByUserId(userId: string): Promise<Account[]> {
    return this.repository
      .createQueryBuilder("account")
      .innerJoin("account.users", "user")
      .where("user.id = :userId", { userId })
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
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: accountId },
        lock: { mode: "pessimistic_write" },
        relations: ["users"],
      });

      if (!account) {
        throw new Error("Account not found");
      }

      account.balance = isDebit
        ? account.balance - amount
        : account.balance + amount;
      const savedAccount = await queryRunner.manager.save(account);
      await queryRunner.commitTransaction();

      return savedAccount;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
