import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
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

  const config = new DocumentBuilder()
    .setTitle("Banking System API")
    .setDescription("API documentation for the Banking System")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = configService.get("app.port", { infer: true });
  await app.listen(port);

  console.log(
    `Application is running on: http://localhost:${port}/${apiPrefix}`
  );
  console.log(`Swagger documentation: http://localhost:${port}/docs`);
}
bootstrap();
