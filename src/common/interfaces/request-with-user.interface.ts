import { Request } from "express";
import { JwtUser } from "./jwt-user.interface";

export interface RequestWithUser extends Request {
  user: JwtUser;
}
