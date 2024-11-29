import { Controller, Post, Get, Body, Param, UseGuards } from "@nestjs/common";
import { TransactionsService } from "./transactions.service";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
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
import {
  QueueJobResponse,
  JobStatus,
} from "./interfaces/queue-response.interface";

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
    status: 202,
    description: "Transaction accepted for processing",
    schema: {
      properties: {
        jobId: {
          type: "string",
          example: "123e4567-e89b-12d3-a456-426614174000",
        },
      },
    },
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
  async create(
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<QueueJobResponse> {
    return this.transactionsService.create(createTransactionDto);
  }

  @Get("status/:jobId")
  @Roles("user", "admin")
  @ApiOperation({ summary: "Get transaction processing status" })
  @ApiResponse({
    status: 200,
    description: "Transaction status",
    schema: {
      properties: {
        status: {
          type: "string",
          enum: [
            "completed",
            "failed",
            "waiting",
            "active",
            "delayed",
            "paused",
            "not_found",
          ],
        },
        data: {
          type: "object",
          description: "Transaction data if completed",
        },
        error: {
          type: "string",
          description: "Error message if failed",
        },
      },
    },
  })
  async getStatus(@Param("jobId") jobId: string): Promise<JobStatus> {
    return this.transactionsService.getTransactionStatus(jobId);
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
  })
  findAll() {
    return this.transactionsService.findAll();
  }

  @Get(":id")
  @Roles("user", "admin")
  @ApiOperation({ summary: "Get transaction by ID" })
  @ApiResponse({
    status: 200,
    description: "Transaction details",
  })
  findById(@Param("id") id: string) {
    return this.transactionsService.findById(id);
  }
}
