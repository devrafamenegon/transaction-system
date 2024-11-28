import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountRepository } from './repositories/account.repository';

@Injectable()
export class AccountsService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account> {
    const existingAccount = await this.accountRepository.findByNumber(createAccountDto.accountNumber);

    if (existingAccount) {
      throw new ConflictException('Account number already exists');
    }

    return this.accountRepository.create(createAccountDto);
  }

  async findByNumber(accountNumber: string): Promise<Account> {
    const account = await this.accountRepository.findByNumber(accountNumber);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async findById(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }
}