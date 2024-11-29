import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { setupTestApp, closeTestApp } from "./jest-setup";
import { RegisterDto } from "../../src/auth/dto/register.dto";
import { LoginDto } from "../../src/auth/dto/login.dto";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe("Authentication", () => {
    const registerDto: RegisterDto = {
      email: "test@example.com",
      password: "password123",
      role: "user",
    };

    const loginDto: LoginDto = {
      email: registerDto.email,
      password: registerDto.password,
    };

    it("/auth/register (POST) - should register a new user", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty("access_token");
      accessToken = response.body.access_token;
    });

    it("/auth/register (POST) - should fail with duplicate email", () => {
      return request(app.getHttpServer())
        .post("/api/auth/register")
        .send(registerDto)
        .expect(409);
    });

    it("/auth/login (POST) - should login successfully", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send(loginDto)
        .expect(201);

      expect(response.body).toHaveProperty("access_token");
      accessToken = response.body.access_token;
    });

    it("/auth/login (POST) - should fail with wrong password", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ ...loginDto, password: "wrongpassword" })
        .expect(401);
    });

    it("/users/me (GET) - should get current user profile", () => {
      return request(app.getHttpServer())
        .get("/api/users/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("email", "test@example.com");
          expect(res.body).toHaveProperty("role", "user");
          expect(res.body).not.toHaveProperty("password");
        });
    });

    it("/users/me (GET) - should fail without token", () => {
      return request(app.getHttpServer()).get("/api/users/me").expect(401);
    });
  });
});
