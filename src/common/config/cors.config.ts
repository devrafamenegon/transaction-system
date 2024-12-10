import { registerAs } from "@nestjs/config";
import { CorsConfig } from "../interfaces/config.interface";

export default registerAs(
  "cors",
  (): CorsConfig => ({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:3000"],
    methods: process.env.CORS_METHODS?.split(",") ?? [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH",
      "OPTIONS",
    ],
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS?.split(",") ?? [
      "Content-Type",
      "Authorization",
      "Accept",
    ],
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS?.split(",") ?? [
      "Content-Range",
      "X-Content-Range",
    ],
    credentials: process.env.CORS_CREDENTIALS === "true",
    maxAge: parseInt(process.env.CORS_MAX_AGE ?? "3600", 10),
  })
);
