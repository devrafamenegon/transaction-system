import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

export class DatabaseException extends BaseException {
  constructor(
    message: string,
    code: string = "DATABASE_ERROR",
    details?: Record<string, any>
  ) {
    super(message, HttpStatus.INTERNAL_SERVER_ERROR, code, details);
  }
}

export class UniqueConstraintException extends DatabaseException {
  constructor(field: string, value: any) {
    super(`Duplicate entry for ${field}`, "UNIQUE_CONSTRAINT_VIOLATION", {
      field,
      value,
    });
  }
}

export class ForeignKeyException extends DatabaseException {
  constructor(field: string, value: any) {
    super(`Referenced ${field} does not exist`, "FOREIGN_KEY_VIOLATION", {
      field,
      value,
    });
  }
}
