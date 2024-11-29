import {
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TransactionType } from "../entities/transaction.entity";

export class CreateTransactionDto {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "ID of the source account",
  })
  @IsUUID()
  sourceAccountId: string;

  @ApiPropertyOptional({
    example: "123e4567-e89b-12d3-a456-426614174001",
    description: "ID of the destination account (required for transfers)",
  })
  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @ApiProperty({
    example: 100.5,
    description: "Amount of the transaction (minimum 0.01)",
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.TRANSFER,
    description: "Type of transaction",
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({
    example: "Monthly rent payment",
    description: "Optional description of the transaction",
  })
  @IsOptional()
  @IsString()
  description?: string;
}
