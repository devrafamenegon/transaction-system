import { registerAs } from "@nestjs/config";
import { AppConfig } from "../interfaces/config.interface";

export default registerAs(
  "app",
  (): AppConfig => ({
    port: parseInt(process.env.PORT ?? "3000", 10),
    apiPrefix: process.env.API_PREFIX ?? "api",
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW ?? "60000", 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
  })
);
