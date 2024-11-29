import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Account } from "./entities/account.entity";
import { CreateAccountDto } from "./dto/create-account.dto";
import { AccountRepository } from "./repositories/account.repository";
import { UserRepository } from "../auth/repositories/user.repository";
import { LoggerService } from "../common/logger/logger.service";
import { User } from "../auth/entities/user.entity";

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    this.logger.debug(
      `Creating new account: ${JSON.stringify(createAccountDto)}`,
      "AccountsService"
    );

    const existingAccount = await this.accountRepository.findByNumber(
      createAccountDto.accountNumber
    );

    if (existingAccount) {
      this.logger.warn(
        `Account creation failed: Account number ${createAccountDto.accountNumber} already exists`,
        "AccountsService"
      );
      throw new ConflictException("Account number already exists");
    }

    const primaryUser = await this.userRepository.findById(
      createAccountDto.userId
    );

    if (!primaryUser) {
      this.logger.warn(
        `Account creation failed: Primary user ${createAccountDto.userId} not found`,
        "AccountsService"
      );
      throw new NotFoundException("Primary user not found");
    }

    let additionalUsers: User[] = [];
    if (createAccountDto.additionalUserIds?.length) {
      additionalUsers = await this.userRepository.findByIds(
        createAccountDto.additionalUserIds
      );

      if (
        additionalUsers.length !== createAccountDto.additionalUserIds.length
      ) {
        this.logger.warn(
          `Account creation failed: One or more additional users not found`,
          "AccountsService"
        );
        throw new NotFoundException("One or more additional users not found");
      }
    }

    const account = await this.accountRepository.create({
      ...createAccountDto,
      users: [primaryUser, ...additionalUsers],
      isSharedAccount:
        createAccountDto.isSharedAccount || additionalUsers.length > 0,
    });

    this.logger.logAccountActivity(account.id, "CREATE", {
      accountNumber: account.accountNumber,
      primaryUser: primaryUser.id,
      additionalUsers: additionalUsers.map((u) => u.id),
      isSharedAccount: account.isSharedAccount,
    });

    return account;
  }

  async findByNumber(accountNumber: string): Promise<Account> {
    this.logger.debug(
      `Searching for account by number: ${accountNumber}`,
      "AccountsService"
    );

    const account = await this.accountRepository.findByNumber(accountNumber);

    if (!account) {
      this.logger.warn(
        `Account not found: ${accountNumber}`,
        "AccountsService"
      );
      throw new NotFoundException("Account not found");
    }

    return account;
  }

  async findById(id: string): Promise<Account> {
    this.logger.debug(`Searching for account by ID: ${id}`, "AccountsService");

    const account = await this.accountRepository.findById(id);

    if (!account) {
      this.logger.warn(`Account not found: ${id}`, "AccountsService");
      throw new NotFoundException("Account not found");
    }

    return account;
  }

  async findUserAccounts(userId: string): Promise<Account[]> {
    this.logger.debug(
      `Retrieving accounts for user: ${userId}`,
      "AccountsService"
    );

    const accounts = await this.accountRepository.findByUserId(userId);

    this.logger.debug(
      `Found ${accounts.length} accounts for user ${userId}`,
      "AccountsService"
    );

    return accounts;
  }

  async validateUserAccess(
    userId: string,
    accountId: string
  ): Promise<boolean> {
    this.logger.debug(
      `Validating user ${userId} access to account ${accountId}`,
      "AccountsService"
    );

    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      this.logger.warn(
        `Access validation failed: Account ${accountId} not found`,
        "AccountsService"
      );
      throw new NotFoundException("Account not found");
    }

    const hasAccess = account.users.some((user) => user.id === userId);

    if (!hasAccess) {
      this.logger.warn(
        `Access denied: User ${userId} attempted to access account ${accountId}`,
        "AccountsService"
      );
      throw new ForbiddenException("User does not have access to this account");
    }

    this.logger.debug(
      `Access validated: User ${userId} has access to account ${accountId}`,
      "AccountsService"
    );

    return true;
  }
}
