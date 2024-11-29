import { Injectable } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { LoggerService } from "../../common/logger/logger.service";
import { AppException } from "../../common/exceptions/app.exception";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService
  ) {}

  async findById(id: string): Promise<User> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new AppException("User not found", 404, "USER_NOT_FOUND", { id });
      }

      return user;
    } catch (error: any) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve user: ${error.message}`,
        error.stack,
        "UserService"
      );

      throw new AppException(
        "Failed to retrieve user",
        500,
        "USER_FETCH_ERROR",
        { id }
      );
    }
  }

  async findAll(): Promise<User[]> {
    try {
      this.logger.debug("Retrieving all users", "UserService");
      return await this.userRepository.findAll();
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve users: ${error.message}`,
        error.stack,
        "UserService"
      );
      throw new AppException(
        "Failed to retrieve users",
        500,
        "USERS_FETCH_ERROR"
      );
    }
  }
}
