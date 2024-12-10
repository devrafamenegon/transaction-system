import { Injectable } from "@nestjs/common";
import { UserRepository } from "../repositories/user.repository";
import { User } from "../entities/user.entity";
import { LoggerService } from "../../common/logger/logger.service";
import { BaseException } from "../../common/exceptions/base.exception";
import { classToPlain } from "class-transformer";

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: LoggerService
  ) {}

  async findById(id: string): Promise<Partial<User>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        throw new BaseException("User not found", 404, "USER_NOT_FOUND", {
          id,
        });
      }

      // Transform the user object to exclude password
      return classToPlain(user) as Partial<User>;
    } catch (error: any) {
      if (error instanceof BaseException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve user: ${error.message}`,
        error.stack,
        "UserService"
      );

      throw new BaseException(
        "Failed to retrieve user",
        500,
        "USER_FETCH_ERROR",
        { id }
      );
    }
  }

  async findAll(): Promise<Partial<User>[]> {
    try {
      this.logger.debug("Retrieving all users", "UserService");
      const users = await this.userRepository.findAll();
      return users.map((user) => classToPlain(user)) as Partial<User>[];
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve users: ${error.message}`,
        error.stack,
        "UserService"
      );
      throw new BaseException(
        "Failed to retrieve users",
        500,
        "USERS_FETCH_ERROR"
      );
    }
  }
}
