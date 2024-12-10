import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { TransactionLogsModule } from "./transaction-logs/transaction-logs.module";
import { AuthModule } from "./auth/auth.module";
import { LoggerModule } from "./common/logger/logger.module";
import {
  appConfig,
  databaseConfig,
  authConfig,
  transactionConfig,
  redisConfig,
} from "./common/config";
import { HealthModule } from "./health/health.module";
import {
  ThrottlerGuard,
  ThrottlerModule,
  ThrottlerModuleOptions,
} from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        authConfig,
        transactionConfig,
        redisConfig,
      ],
      envFilePath: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            ttl: config.get<number>("app.rateLimitWindow", { infer: true }),
            limit: config.get<number>("app.rateLimitMax", { infer: true }),
          },
        ],
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("database.host"),
        port: configService.get("database.port"),
        username: configService.get("database.username"),
        password: configService.get("database.password"),
        database: configService.get("database.database"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: true,
        logging: process.env.NODE_ENV === "development",
        extra: {
          isolationLevel: "SERIALIZABLE",
          maxRetries: configService.get("transaction.maxRetries"),
          retryDelay: configService.get("transaction.initialRetryDelay"),
        },
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get("redis.host"),
          port: configService.get("redis.port"),
        },
      }),
    }),
    LoggerModule,
    AccountsModule,
    TransactionsModule,
    TransactionLogsModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
