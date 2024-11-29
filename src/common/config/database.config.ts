import { registerAs } from "@nestjs/config";
import { DatabaseConfig } from "../interfaces/config.interface";

export default registerAs(
  "database",
  (): DatabaseConfig => ({
    type: process.env.DATABASE_TYPE ?? "postgres",
    host: process.env.DATABASE_HOST ?? "localhost",
    port: parseInt(process.env.DATABASE_PORT ?? "5432", 10),
    username: process.env.DATABASE_USER ?? "postgres",
    password: process.env.DATABASE_PASSWORD ?? "postgres",
    database: process.env.DATABASE_NAME ?? "bank_db",
  })
);
