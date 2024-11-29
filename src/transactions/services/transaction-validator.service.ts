import { Injectable } from "@nestjs/common";
import { LoggerService } from "../../common/logger/logger.service";
import { Account } from "../../accounts/entities/account.entity";
import { TransactionType } from "../entities/transaction.entity";
import { CreateTransactionDto } from "../dto/create-transaction.dto";
import {
  InsufficientFundsException,
  InvalidTransactionException,
} from "../../common/exceptions/business.exception";

@Injectable()
export class TransactionValidatorService {
  constructor(private readonly logger: LoggerService) {}

  validateTransaction(
    createTransactionDto: CreateTransactionDto,
    sourceAccount: Account,
    destinationAccount: Account | null
  ): void {
    this.logger.debug(
      `Validating transaction: ${JSON.stringify(createTransactionDto)}`,
      "TransactionValidator"
    );

    // Validate transfer requirements
    if (createTransactionDto.type === TransactionType.TRANSFER) {
      if (!createTransactionDto.destinationAccountId) {
        throw new InvalidTransactionException(
          "Destination account is required for transfers"
        );
      }
      if (!destinationAccount) {
        throw new InvalidTransactionException("Destination account not found");
      }
      if (sourceAccount.id === destinationAccount.id) {
        throw new InvalidTransactionException(
          "Cannot transfer to the same account"
        );
      }
    }

    // Validate sufficient funds
    if (
      (createTransactionDto.type === TransactionType.WITHDRAWAL ||
        createTransactionDto.type === TransactionType.TRANSFER) &&
      sourceAccount.balance < createTransactionDto.amount
    ) {
      throw new InsufficientFundsException(
        sourceAccount.id,
        createTransactionDto.amount,
        sourceAccount.balance
      );
    }

    // Validate amount
    if (createTransactionDto.amount <= 0) {
      throw new InvalidTransactionException(
        "Transaction amount must be positive"
      );
    }
  }
}
