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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from "@nestjs/swagger";

@ApiTags("Accounts")
@ApiBearerAuth()
@Controller("accounts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @Roles("user", "admin")
  @ApiOperation({ summary: "Create a new bank account" })
  @ApiResponse({
    status: 201,
    description: "Account created successfully",
    type: Account,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid account data",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  create(@Body() createAccountDto: CreateAccountDto): Promise<Account> {
    return this.accountsService.create(createAccountDto);
  }

  @Get(":accountNumber")
  @Roles("admin")
  @ApiOperation({
    summary: "Get account by account number (Admin only)",
    description:
      "Retrieves account details by account number. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "Account details",
    type: Account,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  @ApiResponse({ status: 404, description: "Account not found" })
  findByNumber(
    @Param("accountNumber") accountNumber: string
  ): Promise<Account> {
    return this.accountsService.findByNumber(accountNumber);
  }

  @Get("user/accounts")
  @Roles("user", "admin")
  @ApiOperation({ summary: "Get all accounts for the authenticated user" })
  @ApiResponse({
    status: 200,
    description: "List of user accounts",
    type: [Account],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  findUserAccounts(@Request() req: RequestWithUser): Promise<Account[]> {
    return this.accountsService.findUserAccounts(req.user.userId);
  }
}
