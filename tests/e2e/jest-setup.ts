import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";
import { AppModule } from "../../src/app.module";
import { LoggerService } from "../../src/common/logger/logger.service";
import { ConfigService } from "@nestjs/config";
import { clearDatabase } from "./config/test-database.config";
import { configureTestApp } from "./config/test-app.config";

let app: INestApplication;
let dataSource: DataSource;
let logger: LoggerService;

export async function setupTestApp(): Promise<INestApplication> {
  // Load test environment variables
  config({ path: resolve(__dirname, "../test.env") });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  logger = app.get(LoggerService);
  const configService = app.get(ConfigService);

  // Configure app with global pipes, filters, and interceptors
  configureTestApp(app, logger, configService);

  await app.init();

  // Get database connection and clear data
  dataSource = app.get(DataSource);
  await clearDatabase(dataSource, logger);

  // Wait for Redis connection to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));

  logger.debug("Test application setup completed", "TestSetup");
  return app;
}

export async function closeTestApp(): Promise<void> {
  try {
    if (dataSource?.isInitialized) {
      await clearDatabase(dataSource, logger);
      await dataSource.destroy();
      logger.debug("Database connection closed", "TestSetup");
    }

    if (app) {
      await app.close();
      logger.debug("Application closed", "TestSetup");
    }
  } catch (error: any) {
    logger.error("Error during test cleanup:", error.stack, "TestSetup");
    throw error;
  }
}
