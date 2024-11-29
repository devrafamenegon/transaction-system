import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AccountsModule } from "./accounts/accounts.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { TransactionLogsModule } from "./transaction-logs/transaction-logs.module";
import { AuthModule } from "./auth/auth.module";
import { appConfig, databaseConfig, authConfig } from "./common/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig],
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
        synchronize: process.env.NODE_ENV === "development",
      }),
    }),
    AccountsModule,
    TransactionsModule,
    TransactionLogsModule,
    AuthModule,
  ],
})
export class AppModule {}
