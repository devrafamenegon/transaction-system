import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  VersionColumn,
  ManyToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../auth/entities/user.entity";

@Entity("accounts")
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  accountNumber: string;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance: number;

  @ManyToMany(() => User)
  @JoinTable({
    name: "user_accounts",
    joinColumn: {
      name: "account_id",
      referencedColumnName: "id",
    },
    inverseJoinColumn: {
      name: "user_id",
      referencedColumnName: "id",
    },
  })
  users: User[];

  @Column({ default: false })
  isSharedAccount: boolean;

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
