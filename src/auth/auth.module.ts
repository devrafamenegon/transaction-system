import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { User } from "./entities/user.entity";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UserRepository } from "./repositories/user.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("auth.jwt.secret"),
        signOptions: {
          expiresIn: configService.get<string>("auth.jwt.expiresIn"),
        },
      }),
    }),
  ],
  controllers: [AuthController, UserController],
  providers: [AuthService, UserService, JwtStrategy, UserRepository],
  exports: [AuthService, UserRepository, TypeOrmModule],
})
export class AuthModule {}
