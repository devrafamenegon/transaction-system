import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

export class AuthException extends BaseException {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNAUTHORIZED, code, details);
  }
}

export class InvalidCredentialsException extends AuthException {
  constructor(details?: Record<string, any>) {
    super("Invalid credentials", "AUTH_INVALID_CREDENTIALS", details);
  }
}

export class UserAlreadyExistsException extends BaseException {
  constructor(email: string) {
    super("User already exists", HttpStatus.CONFLICT, "AUTH_USER_EXISTS", {
      email,
    });
  }
}
