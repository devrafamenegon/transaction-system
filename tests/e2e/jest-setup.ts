import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { AllExceptionsFilter } from "../../src/common/filters/all-exceptions.filter";
import { ErrorLoggingInterceptor } from "../../src/common/interceptors/error-logging.interceptor";
import { LoggerService } from "../../src/common/logger/logger.service";

let app: INestApplication;
let dataSource: DataSource;

export const setupTestApp = async (): Promise<INestApplication> => {
  // Set test environment variables
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-secret-key";
  process.env.DATABASE_HOST = "localhost";
  process.env.DATABASE_PORT = "5433";
  process.env.DATABASE_NAME = "bank_db_test";

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  const logger = app.get(LoggerService);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ErrorLoggingInterceptor(logger));

  app.setGlobalPrefix(configService.get("app.apiPrefix") ?? "/api");

  await app.init();

  dataSource = app.get(DataSource);
  await clearDatabase();

  return app;
};

export const clearDatabase = async () => {
  if (!dataSource || !dataSource.isInitialized) {
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
  } catch (error) {
    console.error("Error clearing database:", error);
  }
};

export const closeTestApp = async () => {
  if (dataSource?.isInitialized) {
    await clearDatabase();
    await dataSource.destroy();
  }
  if (app) {
    await app.close();
  }
};
