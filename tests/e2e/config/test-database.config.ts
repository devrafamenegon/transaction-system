import { DataSource } from "typeorm";
import { LoggerService } from "../../../src/common/logger/logger.service";

export async function clearDatabase(
  dataSource: DataSource,
  logger: LoggerService
): Promise<void> {
  if (!dataSource?.isInitialized) {
    return;
  }

  try {
    // Drop tables in correct order to avoid foreign key constraints
    await dataSource.query("DROP TABLE IF EXISTS transaction_logs CASCADE");
    await dataSource.query("DROP TABLE IF EXISTS transactions CASCADE");
    await dataSource.query("DROP TABLE IF EXISTS account_users CASCADE");
    await dataSource.query("DROP TABLE IF EXISTS accounts CASCADE");
    await dataSource.query("DROP TABLE IF EXISTS users CASCADE");

    // Synchronize database to recreate tables
    await dataSource.synchronize(true);

    logger.debug("Database cleared and synchronized", "TestSetup");
  } catch (error: any) {
    logger.error("Error clearing database:", error.stack, "TestSetup");
    throw error;
  }
}
