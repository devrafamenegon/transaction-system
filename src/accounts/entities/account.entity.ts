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
import { ApiProperty } from "@nestjs/swagger";
import { User } from "../../auth/entities/user.entity";

@Entity("accounts")
export class Account {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The unique identifier of the account",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    example: "1234567890",
    description: "Unique account number",
  })
  @Column({ unique: true })
  accountNumber: string;

  @ApiProperty({
    example: 1000.5,
    description: "Current balance of the account",
  })
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  balance: number;

  @ApiProperty({
    type: () => [User],
    description: "Users associated with this account",
  })
  @ManyToMany(() => User, (user) => user.accounts)
  @JoinTable()
  users: User[];

  @ApiProperty({
    example: false,
    description: "Indicates if this is a shared account",
  })
  @Column({ default: false })
  isSharedAccount: boolean;

  @ApiProperty({
    example: 1,
    description: "Version number for optimistic locking",
  })
  @VersionColumn()
  version: number;

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the account was created",
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the account was last updated",
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
