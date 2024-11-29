import { HttpStatus } from "@nestjs/common";
import { AppException } from "./app.exception";

export class AuthException extends AppException {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, HttpStatus.UNAUTHORIZED, code, details);
  }
}

export class InvalidCredentialsException extends AuthException {
  constructor(details?: Record<string, any>) {
    super("Invalid credentials", "AUTH_INVALID_CREDENTIALS", details);
  }
}

export class UserAlreadyExistsException extends AuthException {
  constructor(email: string) {
    super("User already exists", "AUTH_USER_EXISTS", { email });
  }
}
