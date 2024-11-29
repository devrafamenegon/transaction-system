import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

export class BusinessException extends BaseException {
  constructor(
    message: string,
    code: string = "BUSINESS_RULE_VIOLATION",
    details?: Record<string, any>
  ) {
    super(message, HttpStatus.BAD_REQUEST, code, details);
  }
}

export class InsufficientFundsException extends BusinessException {
  constructor(accountId: string, required: number, available: number) {
    super("Insufficient funds for transaction", "INSUFFICIENT_FUNDS", {
      accountId,
      required,
      available,
    });
  }
}

export class InvalidTransactionException extends BusinessException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "INVALID_TRANSACTION", details);
  }
}
