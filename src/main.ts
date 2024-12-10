import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { Config } from "./common/interfaces/config.interface";
import { writeFileSync } from "fs";
import { join } from "path";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ErrorLoggingInterceptor } from "./common/interceptors/error-logging.interceptor";
import { LoggerService } from "./common/logger/logger.service";
import { BaseException } from "./common/exceptions/base.exception";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<Config, true>>(ConfigService);
  const logger = app.get(LoggerService);

  // Configure CORS
  const corsConfig = configService.get("cors", { infer: true });
  app.enableCors(corsConfig);

  // Global error handling
  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ErrorLoggingInterceptor(logger));

  // Global data validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const details = errors.reduce<Record<string, string[]>>(
          (acc, error) => {
            acc[error.property] = Object.values(error.constraints ?? {});
            return acc;
          },
          {}
        );

        return new BaseException(
          "Validation failed",
          HttpStatus.BAD_REQUEST,
          "VALIDATION_ERROR",
          details
        );
      },
    })
  );

  // Global prefix
  const apiPrefix = configService.get("app.apiPrefix", { infer: true });
  app.setGlobalPrefix(apiPrefix);

  // Setup documentation
  const config = new DocumentBuilder()
    .setTitle("Banking System API")
    .setDescription("API documentation for the Banking System")
    .setVersion("1.0")
    .addBearerAuth()
    .addApiKey({ type: "apiKey", name: "role", in: "header" }, "admin")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  writeFileSync(
    join(process.cwd(), "swagger.json"),
    JSON.stringify(document, null, 2),
    { encoding: "utf8" }
  );

  // Publish documentation indo /docs
  SwaggerModule.setup("docs", app, document);

  const port = configService.get("app.port", { infer: true });
  await app.listen(port);

  logger.log(
    `Application is running on: http://localhost:${port}/${apiPrefix}`,
    "Bootstrap"
  );
  logger.log(
    `Swagger documentation: http://localhost:${port}/docs`,
    "Bootstrap"
  );
  logger.log(
    `Swagger JSON file generated at: ${join(process.cwd(), "swagger.json")}`,
    "Bootstrap"
  );
}
bootstrap();
