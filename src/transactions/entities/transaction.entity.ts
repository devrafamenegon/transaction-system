import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { Account } from "../../accounts/entities/account.entity";

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  TRANSFER = "transfer",
}

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Account)
  sourceAccount: Account;

  @ManyToOne(() => Account, { nullable: true })
  destinationAccount: Account | null;

  @Column("decimal", { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "simple-enum",
    enum: TransactionType,
  })
  type: TransactionType;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  description: string;
}
