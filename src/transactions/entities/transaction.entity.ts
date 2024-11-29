import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Account } from "../../accounts/entities/account.entity";

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer",
}

@Entity("transactions")
export class Transaction {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The unique identifier of the transaction",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    type: () => Account,
    description: "Source account of the transaction",
  })
  @ManyToOne(() => Account)
  sourceAccount: Account;

  @ApiProperty({
    type: () => Account,
    description: "Destination account for transfers",
    nullable: true,
  })
  @ManyToOne(() => Account, { nullable: true })
  destinationAccount: Account | null;

  @ApiProperty({
    example: 100.5,
    description: "Amount of the transaction",
  })
  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.TRANSFER,
    description: "Type of transaction",
  })
  @Column({
    type: "simple-enum",
    enum: TransactionType,
  })
  type: TransactionType;

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the transaction was created",
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: "Monthly rent payment",
    description: "Optional description of the transaction",
  })
  @Column({ nullable: true })
  description: string;
}
