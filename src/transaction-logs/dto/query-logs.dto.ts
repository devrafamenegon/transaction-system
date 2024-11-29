import { IsOptional, IsString, IsDateString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QueryLogsDto {
  @ApiPropertyOptional({
    example: "1234567890",
    description: "Account number to filter logs",
  })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({
    example: "2023-01-01",
    description: "Start date for filtering logs (ISO format)",
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: "2023-12-31",
    description: "End date for filtering logs (ISO format)",
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
