import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { TransactionLogsService } from "./transaction-logs.service";
import { QueryLogsDto } from "./dto/query-logs.dto";
import { TransactionLog } from "./entities/transaction-log.entity";
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

@ApiTags("Transaction Logs")
@ApiBearerAuth()
@Controller("transaction-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransactionLogsController {
  constructor(
    private readonly transactionLogsService: TransactionLogsService
  ) {}

  @Get()
  @Roles("admin")
  @ApiOperation({
    summary: "Query transaction logs with filters (Admin only)",
    description:
      "Query and filter transaction logs. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "List of filtered transaction logs",
    type: [TransactionLog],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async queryLogs(
    @Query() queryParams: QueryLogsDto
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.queryLogs(queryParams);
  }

  @Get("by-account")
  @Roles("admin")
  @ApiOperation({
    summary: "Get transaction logs by account number (Admin only)",
    description:
      "Retrieves transaction logs for a specific account. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "List of transaction logs for the specified account",
    type: [TransactionLog],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Insufficient permissions",
  })
  @ApiResponse({ status: 404, description: "Account not found" })
  async findByAccountNumber(
    @Query("accountNumber") accountNumber: string
  ): Promise<TransactionLog[]> {
    return this.transactionLogsService.findByAccountNumber(accountNumber);
  }
}
