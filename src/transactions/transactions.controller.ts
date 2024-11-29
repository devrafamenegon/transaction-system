import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { Transaction } from "./entities/transaction.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from "@nestjs/swagger";

@ApiTags("Transactions")
@ApiBearerAuth()
@Controller("transactions")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @Roles("user", "admin")
  @ApiOperation({ summary: "Create a new transaction" })
  @ApiResponse({
    status: 201,
    description: "Transaction created successfully",
    type: Transaction,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid transaction data",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  create(
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<Transaction> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get()
  @Roles("admin")
  @ApiOperation({
    summary: "Get all transactions (Admin only)",
    description:
      "Retrieves all transactions in the system. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "List of all transactions",
    type: [Transaction],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  findAll(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }

  @Get(":id")
  @Roles("user", "admin")
  @ApiOperation({ summary: "Get transaction by ID" })
  @ApiResponse({
    status: 200,
    description: "Transaction details",
    type: Transaction,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  @ApiResponse({ status: 404, description: "Transaction not found" })
  findById(@Param("id") id: string): Promise<Transaction> {
    return this.transactionsService.findById(id);
  }
}
