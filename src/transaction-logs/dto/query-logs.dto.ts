import { IsOptional, IsString, IsDateString } from 'class-validator';

export class QueryLogsDto {
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}