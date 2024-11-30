import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AllExceptionsFilter } from "../../../src/common/filters/all-exceptions.filter";
import { ErrorLoggingInterceptor } from "../../../src/common/interceptors/error-logging.interceptor";
import { LoggerService } from "../../../src/common/logger/logger.service";

export function configureTestApp(
  app: INestApplication,
  logger: LoggerService,
  configService: ConfigService
): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter(logger));
  app.useGlobalInterceptors(new ErrorLoggingInterceptor(logger));

  app.setGlobalPrefix(configService.get("app.apiPrefix") ?? "api");
}
