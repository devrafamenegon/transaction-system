import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { setupTestApp, closeTestApp } from "./jest-setup";
import { RegisterDto } from "../../src/auth/dto/register.dto";
import { CreateAccountDto } from "../../src/accounts/dto/create-account.dto";

describe("AccountsController (e2e)", () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let accountId: string;

  beforeAll(async () => {
    app = await setupTestApp();

    // Create test users
    const userRegisterDto: RegisterDto = {
      email: "user@example.com",
      password: "password123",
      role: "user",
    };

    const adminRegisterDto: RegisterDto = {
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    };

    // Register and get tokens
    const userResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(userRegisterDto);
    userToken = userResponse.body.access_token;

    const adminResponse = await request(app.getHttpServer())
      .post("/api/auth/register")
      .send(adminRegisterDto);
    adminToken = adminResponse.body.access_token;

    // Get user profile to get userId
    const profileResponse = await request(app.getHttpServer())
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    userId = profileResponse.body.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe("Account Management", () => {
    it("/accounts (POST) - should create a new account", async () => {
      const createAccountDto: CreateAccountDto = {
        accountNumber: "1234567890",
        userId: userId,
        isSharedAccount: false,
      };

      const response = await request(app.getHttpServer())
        .post("/api/accounts")
        .set("Authorization", `Bearer ${userToken}`)
        .send(createAccountDto)
        .expect(201);

      accountId = response.body.id;
      expect(response.body).toHaveProperty(
        "accountNumber",
        createAccountDto.accountNumber
      );
      expect(response.body.balance).toBe("0.00");
    });

    it("/accounts (POST) - should fail with duplicate account number", () => {
      const createAccountDto: CreateAccountDto = {
        accountNumber: "1234567890",
        userId: userId,
        isSharedAccount: false,
      };

      return request(app.getHttpServer())
        .post("/api/accounts")
        .set("Authorization", `Bearer ${userToken}`)
        .send(createAccountDto)
        .expect(409);
    });

    it("/accounts/:accountNumber (GET) - admin should get account details", () => {
      return request(app.getHttpServer())
        .get("/api/accounts/1234567890")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("accountNumber", "1234567890");
          expect(res.body).toHaveProperty("balance");
          expect(res.body).toHaveProperty("users");
        });
    });

    it("/accounts/:accountNumber (GET) - user should not access account details directly", () => {
      return request(app.getHttpServer())
        .get("/api/accounts/1234567890")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("/accounts/user/accounts (GET) - should get user accounts", () => {
      return request(app.getHttpServer())
        .get("/api/accounts/user/accounts")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty("accountNumber");
        });
    });
  });
});
