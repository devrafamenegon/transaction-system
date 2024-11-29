import { registerAs } from "@nestjs/config";
import { RedisConfig } from "../interfaces/config.interface";

export default registerAs(
  "redis",
  (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
  })
);
