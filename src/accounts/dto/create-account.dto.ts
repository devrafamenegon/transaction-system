import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAccountDto {
  @ApiProperty({
    example: "1234567890",
    description: "Unique account number",
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "ID of the primary account holder",
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    example: ["123e4567-e89b-12d3-a456-426614174001"],
    description: "IDs of additional users for shared accounts",
    type: [String],
  })
  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  additionalUserIds?: string[];

  @ApiPropertyOptional({
    example: false,
    description: "Indicates if this is a shared account",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSharedAccount?: boolean;
}
