import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { Account } from "../../accounts/entities/account.entity";
import { Transaction } from "../../transactions/entities/transaction.entity";

export enum LogStatus {
  SUCCESS = "success",
  FAILED = "failed",
}

@Entity("transaction_logs")
export class TransactionLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Transaction)
  transaction: Transaction;

  @ManyToOne(() => Account)
  account: Account;

  @Column()
  transactionId: string;

  @Column()
  accountId: string;

  @Column("decimal", { precision: 10, scale: 2 })
  previousBalance: number;

  @Column("decimal", { precision: 10, scale: 2 })
  newBalance: number;

  @Column({
    type: "simple-enum",
    enum: LogStatus,
  })
  status: LogStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "text", nullable: true })
  metadata: string;
}
