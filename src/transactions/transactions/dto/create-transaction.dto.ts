import {
  IsEnum,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  Min,
} from "class-validator";
import { TransactionType } from "../entities/transaction.entity";

export class CreateTransactionDto {
  @IsUUID()
  sourceAccountId: string;

  @IsOptional()
  @IsUUID()
  destinationAccountId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsOptional()
  @IsString()
  description?: string;
}
