import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { Account } from "./entities/account.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RequestWithUser } from "../common/interfaces/request-with-user.interface";

@Controller("accounts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles("user", "admin")
  create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  @Get(":accountNumber")
  @Roles("user", "admin")
  findByNumber(
    @Param("accountNumber") accountNumber: string
  ): Promise<Account> {
    return this.accountsService.findByNumber(accountNumber);
  }

  @Get("user/accounts")
  @Roles("user", "admin")
  findUserAccounts(@Request() req: RequestWithUser): Promise<Account[]> {
    return this.accountsService.findUserAccounts(req.user.userId);
  }
}
