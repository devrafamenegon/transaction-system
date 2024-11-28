import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from './entities/account.entity';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  @Get(':accountNumber')
  findByNumber(@Param('accountNumber') accountNumber: string): Promise<Account> {
    return this.accountsService.findByNumber(accountNumber);
  }
}