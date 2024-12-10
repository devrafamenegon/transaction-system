import { Test, TestingModule } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "../../../src/auth/auth.service";
import { UserRepository } from "../../../src/auth/repositories/user.repository";
import { LoggerService } from "../../../src/common/logger/logger.service";
import { User } from "../../../src/auth/entities/user.entity";
import { RegisterDto } from "../../../src/auth/dto/register.dto";
import { LoginDto } from "../../../src/auth/dto/login.dto";
import * as bcrypt from "bcrypt";
import { InvalidCredentialsException } from "../../../src/common/exceptions/auth.exception";
import { BaseException } from "../../../src/common/exceptions/base.exception";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockUser: User = {
    id: "123",
    email: "test@example.com",
    password: "hashedPassword",
    role: "user",
    accounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            logAuthActivity: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
    loggerService = module.get(LoggerService);
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "password123",
      role: "user",
    };

    it("should successfully register a new user", async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      jwtService.sign.mockReturnValue("jwt-token");

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: "jwt-token" });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(loggerService.logAuthActivity).toHaveBeenCalledWith(
        mockUser.id,
        "Register",
        true
      );
    });

    it("should throw BaseException if email exists", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BaseException
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully login a user", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue("jwt-token");

      const result = await service.login(loginDto);

      expect(result).toEqual({ access_token: "jwt-token" });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(loggerService.logAuthActivity).toHaveBeenCalledWith(
        mockUser.id,
        "Login",
        true
      );
    });

    it("should throw InvalidCredentialsException if user not found", async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException
      );
      expect(loggerService.logAuthActivity).toHaveBeenCalledWith(
        loginDto.email,
        "Login",
        false
      );
    });

    it("should throw InvalidCredentialsException if password is incorrect", async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException
      );
      expect(loggerService.logAuthActivity).toHaveBeenCalledWith(
        mockUser.id,
        "Login",
        false
      );
    });
  });
});
