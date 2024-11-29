import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { Config } from "./common/interfaces/config.interface";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService<Config, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const apiPrefix = configService.get("app.apiPrefix", { infer: true });
  app.setGlobalPrefix(apiPrefix);

  const port = configService.get("app.port", { infer: true });
  await app.listen(port);

  console.log(
    `Application is running on: http://localhost:${port}/${apiPrefix}`
  );
}
bootstrap();
