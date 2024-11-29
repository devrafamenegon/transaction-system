import { Controller, Get, UseGuards, Request, Param } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiSecurity,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RolesGuard } from "../guards/roles.guard";
import { Roles } from "../decorators/roles.decorator";
import { UserService } from "../services/user.service";
import { User } from "../entities/user.entity";
import { RequestWithUser } from "../../common/interfaces/request-with-user.interface";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "Current user profile",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getCurrentUser(
    @Request() req: RequestWithUser
  ): Promise<Partial<User>> {
    return this.userService.findById(req.user.userId);
  }

  @Get()
  @Roles("admin")
  @ApiOperation({
    summary: "Get all users (Admin only)",
    description:
      "Retrieves all users in the system. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "List of all users",
    type: [User],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  async findAll(): Promise<Partial<User>[]> {
    return this.userService.findAll();
  }

  @Get(":id")
  @Roles("admin")
  @ApiOperation({
    summary: "Get user by ID (Admin only)",
    description:
      "Retrieves a specific user by their ID. This endpoint is restricted to administrators only.",
  })
  @ApiSecurity("admin")
  @ApiResponse({
    status: 200,
    description: "User details",
    type: User,
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin access required",
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async findById(@Param("id") id: string): Promise<Partial<User>> {
    return this.userService.findById(id);
  }
}
