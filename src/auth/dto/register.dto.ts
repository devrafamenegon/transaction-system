import { IsEmail, IsString, MinLength, IsIn } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "password123",
    description: "User password (minimum 6 characters)",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: "user",
    description: "User role (admin or user)",
    enum: ["admin", "user"],
  })
  @IsString()
  @IsIn(["admin", "user"])
  role: string;
}
