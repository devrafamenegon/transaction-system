import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { LoggerService } from "../../common/logger/logger.service";

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly logger: LoggerService
  ) {}

  async findById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by ID: ${id}`, "UserRepository");
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.accounts", "accounts")
      .where("user.id = :id", { id })
      .getOne();
  }

  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`, "UserRepository");
    return this.repository
      .createQueryBuilder("user")
      .where("user.email = :email", { email })
      .getOne();
  }

  async create(userData: Partial<User>): Promise<User> {
    this.logger.debug(
      `Creating new user: ${JSON.stringify(userData)}`,
      "UserRepository"
    );
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async findByIds(ids: string[]): Promise<User[]> {
    this.logger.debug(
      `Finding users by IDs: ${ids.join(", ")}`,
      "UserRepository"
    );
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.accounts", "accounts")
      .whereInIds(ids)
      .getMany();
  }

  async findAll(): Promise<User[]> {
    this.logger.debug("Finding all users", "UserRepository");
    return this.repository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.accounts", "accounts")
      .getMany();
  }
}
