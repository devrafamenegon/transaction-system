import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  IsUUID,
} from "class-validator";

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsArray()
  @IsUUID("4", { each: true })
  @IsOptional()
  additionalUserIds?: string[];

  @IsBoolean()
  @IsOptional()
  isSharedAccount?: boolean;
}
