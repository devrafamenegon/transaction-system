import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UserRepository } from "./repositories/user.repository";
import { LoggerService } from "../common/logger/logger.service";
import {
  InvalidCredentialsException,
  UserAlreadyExistsException,
} from "../common/exceptions/auth.exception";
import { AppException } from "../common/exceptions/app.exception";
import { JwtPayload } from "../common/interfaces/jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    try {
      const existingUser = await this.userRepository.findByEmail(
        registerDto.email
      );

      if (existingUser) {
        throw new UserAlreadyExistsException(registerDto.email);
      }

      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      const user = await this.userRepository.create({
        ...registerDto,
        password: hashedPassword,
      });

      this.logger.logAuthActivity(user.id, "Register", true);
      return this.generateToken(user);
    } catch (error: any) {
      if (error instanceof UserAlreadyExistsException) {
        throw error;
      }

      this.logger.error(
        `Registration failed: ${error.message}`,
        error.stack,
        "AuthService"
      );
      throw new AppException(
        "Failed to register user",
        500,
        "AUTH_REGISTRATION_FAILED",
        { email: registerDto.email }
      );
    }
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    try {
      const user = await this.userRepository.findByEmail(loginDto.email);

      if (!user) {
        this.logger.logAuthActivity(loginDto.email, "Login", false);
        throw new InvalidCredentialsException();
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password
      );

      if (!isPasswordValid) {
        this.logger.logAuthActivity(user.id, "Login", false);
        throw new InvalidCredentialsException();
      }

      this.logger.logAuthActivity(user.id, "Login", true);
      return this.generateToken(user);
    } catch (error: any) {
      if (error instanceof InvalidCredentialsException) {
        throw error;
      }

      this.logger.error(
        `Login failed: ${error.message}`,
        error.stack,
        "AuthService"
      );
      throw new AppException(
        "Failed to process login",
        500,
        "AUTH_LOGIN_FAILED",
        { email: loginDto.email }
      );
    }
  }

  private generateToken(user: User): { access_token: string } {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
