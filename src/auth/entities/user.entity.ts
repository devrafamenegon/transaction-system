import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from "typeorm";
import { ApiProperty, ApiHideProperty } from "@nestjs/swagger";
import { Account } from "../../accounts/entities/account.entity";
import { Exclude } from "class-transformer";

@Entity("users")
export class User {
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "The unique identifier of the user",
  })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @Column({ unique: true })
  email: string;

  @ApiHideProperty()
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    example: "user",
    description: "User role (admin or user)",
    enum: ["admin", "user"],
  })
  @Column()
  role: string;

  @ApiProperty({
    type: () => [Account],
    description: "Accounts associated with this user",
  })
  @ManyToMany(() => Account, (account) => account.users)
  accounts: Account[];

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the user was created",
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    example: "2023-01-01T00:00:00Z",
    description: "Timestamp when the user was last updated",
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
