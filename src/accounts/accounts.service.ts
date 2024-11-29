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
import { User } from "../auth/entities/user.entity";

@Injectable()
export class AccountsService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userRepository: UserRepository
  ) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const existingAccount = await this.accountRepository.findByNumber(
      createAccountDto.accountNumber
    );

    if (existingAccount) {
      throw new ConflictException("Account number already exists");
    }

    const primaryUser = await this.userRepository.findById(
      createAccountDto.userId
    );

    if (!primaryUser) {
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
        throw new NotFoundException("One or more additional users not found");
      }
    }

    const account = await this.accountRepository.create({
      ...createAccountDto,
      users: [primaryUser, ...additionalUsers],
      isSharedAccount:
        createAccountDto.isSharedAccount || additionalUsers.length > 0,
    });

    return account;
  }

  async findByNumber(accountNumber: string): Promise<Account> {
    const account = await this.accountRepository.findByNumber(accountNumber);

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    return account;
  }

  async findById(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    return account;
  }

  async findUserAccounts(userId: string): Promise<Account[]> {
    return this.accountRepository.findByUserId(userId);
  }

  async validateUserAccess(
    userId: string,
    accountId: string
  ): Promise<boolean> {
    const account = await this.accountRepository.findById(accountId);

    if (!account) {
      throw new NotFoundException("Account not found");
    }

    const hasAccess = account.users.some((user) => user.id === userId);
    if (!hasAccess) {
      throw new ForbiddenException("User does not have access to this account");
    }

    return true;
  }
}
