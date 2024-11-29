import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { setupTestApp, closeTestApp } from "./jest-setup";
import { RegisterDto } from "../../src/auth/dto/register.dto";
import { CreateAccountDto } from "../../src/accounts/dto/create-account.dto";
import { CreateTransactionDto } from "../../src/transactions/dto/create-transaction.dto";
import { TransactionType } from "../../src/transactions/entities/transaction.entity";

describe("TransactionsController (e2e)", () => {
  let app: INestApplication;
  let userToken: string;
  let adminToken: string;
  let sourceAccountId: string;
  let destinationAccountId: string;
  let userId: string;

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

    // Get user profile
    const profileResponse = await request(app.getHttpServer())
      .get("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    userId = profileResponse.body.id;

    // Create test accounts
    const sourceAccountDto: CreateAccountDto = {
      accountNumber: "1234567890",
      userId: userId,
      isSharedAccount: false,
    };

    const destinationAccountDto: CreateAccountDto = {
      accountNumber: "0987654321",
      userId: userId,
      isSharedAccount: false,
    };

    const sourceAccountResponse = await request(app.getHttpServer())
      .post("/api/accounts")
      .set("Authorization", `Bearer ${userToken}`)
      .send(sourceAccountDto);
    sourceAccountId = sourceAccountResponse.body.id;

    const destinationAccountResponse = await request(app.getHttpServer())
      .post("/api/accounts")
      .set("Authorization", `Bearer ${userToken}`)
      .send(destinationAccountDto);
    destinationAccountId = destinationAccountResponse.body.id;
  });

  afterAll(async () => {
    await closeTestApp();
  });

  describe("Transaction Operations", () => {
    it("should make a deposit", async () => {
      const depositDto: CreateTransactionDto = {
        sourceAccountId,
        amount: 1000,
        type: TransactionType.DEPOSIT,
        description: "Initial deposit",
      };

      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send(depositDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("type", TransactionType.DEPOSIT);
          expect(res.body).toHaveProperty("amount", 1000);
        });
    });

    it("should make a withdrawal", async () => {
      const withdrawalDto: CreateTransactionDto = {
        sourceAccountId,
        amount: 500,
        type: TransactionType.WITHDRAWAL,
        description: "ATM withdrawal",
      };

      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send(withdrawalDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("type", TransactionType.WITHDRAWAL);
          expect(res.body).toHaveProperty("amount", 500);
        });
    });

    it("should fail withdrawal with insufficient funds", () => {
      const withdrawalDto: CreateTransactionDto = {
        sourceAccountId,
        amount: 5000,
        type: TransactionType.WITHDRAWAL,
        description: "Should fail",
      };

      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send(withdrawalDto)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toBe("Insufficient funds for transaction");
        });
    });

    it("should make a transfer between accounts", async () => {
      const transferDto: CreateTransactionDto = {
        sourceAccountId,
        destinationAccountId,
        amount: 200,
        type: TransactionType.TRANSFER,
        description: "Test transfer",
      };

      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .send(transferDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("type", TransactionType.TRANSFER);
          expect(res.body).toHaveProperty("amount", 200);
          expect(res.body).toHaveProperty("destinationAccount");
        });
    });

    it("should get transaction history (admin only)", () => {
      return request(app.getHttpServer())
        .get("/api/transactions")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty("type");
          expect(res.body[0]).toHaveProperty("amount");
        });
    });

    it("should not allow regular users to access all transactions", () => {
      return request(app.getHttpServer())
        .get("/api/transactions")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe("Transaction Logs", () => {
    it("should get transaction logs (admin only)", () => {
      return request(app.getHttpServer())
        .get("/api/transaction-logs")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty("status");
          expect(res.body[0]).toHaveProperty("previousBalance");
          expect(res.body[0]).toHaveProperty("newBalance");
        });
    });

    it("should not allow regular users to access transaction logs", () => {
      return request(app.getHttpServer())
        .get("/api/transaction-logs")
        .set("Authorization", `Bearer ${userToken}`)
        .expect(403);
    });

    it("should get logs by account number (admin only)", () => {
      return request(app.getHttpServer())
        .get("/api/transaction-logs/by-account")
        .query({ accountNumber: "1234567890" })
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });
});
