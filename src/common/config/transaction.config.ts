import { registerAs } from "@nestjs/config";
import { TransactionConfig } from "../interfaces/config.interface";

export default registerAs(
  "transaction",
  (): TransactionConfig => ({
    maxRetries: parseInt(process.env.TRANSACTION_MAX_RETRIES ?? "5", 10),
    initialRetryDelay: parseInt(
      process.env.TRANSACTION_INITIAL_RETRY_DELAY ?? "50",
      10
    ),
  })
);
