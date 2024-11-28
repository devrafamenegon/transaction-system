import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  VersionColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  accountNumber: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
