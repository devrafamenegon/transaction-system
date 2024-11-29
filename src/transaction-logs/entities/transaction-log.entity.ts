import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Transaction } from "../../transactions/entities/transaction.entity";
import { Account } from "../../accounts/entities/account.entity";

export enum LogStatus {
  SUCCESS = "success",
  FAILED = "failed",
}

@Entity("transaction_logs")
export class TransactionLog {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The unique identifier of the log entry",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    type: () => Transaction,
    description: "Associated transaction",
  })
  @ManyToOne(() => Transaction)
  transaction: Transaction;

  @ApiProperty({
    type: () => Account,
    description: "Associated account",
  })
  @ManyToOne(() => Account)
  account: Account;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "ID of the associated transaction",
  })
  @Column()
  transactionId: string;

  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "ID of the associated account",
  })
  @Column()
  accountId: string;

  @ApiProperty({
    example: 1000.5,
    description: "Account balance before the transaction",
  })
  @Column("decimal", { precision: 10, scale: 2 })
  previousBalance: number;

  @ApiProperty({
    example: 900.5,
    description: "Account balance after the transaction",
  })
  @Column("decimal", { precision: 10, scale: 2 })
  newBalance: number;

  @ApiProperty({
    enum: LogStatus,
    example: LogStatus.SUCCESS,
    description: "Status of the transaction",
  })
  @Column({
    type: "simple-enum",
    enum: LogStatus,
  })
  status: LogStatus;

  @ApiProperty({
    example: "Insufficient funds",
    description: "Error message if the transaction failed",
    nullable: true,
  })
  @Column({ nullable: true })
  errorMessage?: string;

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the log entry was created",
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: '{"transactionType":"transfer","description":"Monthly rent"}',
    description: "Additional metadata about the transaction",
    nullable: true,
  })
  @Column({ type: "text", nullable: true })
  metadata: string;
}
