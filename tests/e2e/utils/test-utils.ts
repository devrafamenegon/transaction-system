import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { JobStatus } from "../../../src/transactions/interfaces/queue-response.interface";

export async function waitForTransactionCompletion(
  app: INestApplication,
  jobId: string,
  token: string,
  maxAttempts = 5,
  interval = 500
): Promise<JobStatus> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await request(app.getHttpServer())
      .get(`/api/transactions/status/${jobId}`)
      .set("Authorization", `Bearer ${token}`);

    const status = response.body as JobStatus;

    // Log status for debugging
    console.log(
      `Job ${jobId} status: ${status.status} (attempt ${i + 1}/${maxAttempts})`
    );

    if (status.status === "completed" || status.status === "failed") {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `Transaction processing timeout after ${maxAttempts} attempts`
  );
}

export async function getAccountBalance(
  app: INestApplication,
  accountNumber: string,
  token: string,
  retries = 3,
  interval = 500
): Promise<string> {
  let lastError = {} as Error;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await request(app.getHttpServer())
        .get(`/api/accounts/${accountNumber}`)
        .set("Authorization", `Bearer ${token}`);

      if (response.status === 200 && response.body.balance) {
        return response.body.balance;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error: any) {
      lastError = error;
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw (
    lastError || new Error(`Failed to get balance for account ${accountNumber}`)
  );
}

export async function waitForBalanceUpdate(
  app: INestApplication,
  accountNumber: string,
  token: string,
  expectedBalance: string,
  maxAttempts = 10,
  interval = 500
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const balance = await getAccountBalance(app, accountNumber, token);
    if (balance === expectedBalance) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(
    `Balance did not update to expected value ${expectedBalance}`
  );
}

export async function createTestUser(
  app: INestApplication,
  email: string,
  role: string
): Promise<{ token: string; userId: string }> {
  const registerResponse = await request(app.getHttpServer())
    .post("/api/auth/register")
    .send({
      email,
      password: "password123",
      role,
    });

  const token = registerResponse.body.access_token;

  const profileResponse = await request(app.getHttpServer())
    .get("/api/users/me")
    .set("Authorization", `Bearer ${token}`);

  return {
    token,
    userId: profileResponse.body.id,
  };
}

export async function createTestAccount(
  app: INestApplication,
  token: string,
  accountNumber: string,
  userId: string
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post("/api/accounts")
    .set("Authorization", `Bearer ${token}`)
    .send({
      accountNumber,
      userId,
      isSharedAccount: false,
    });

  return response.body.id;
}

export async function processTransaction(
  app: INestApplication,
  token: string,
  transactionDto: any
): Promise<void> {
  const response = await request(app.getHttpServer())
    .post("/api/transactions")
    .set("Authorization", `Bearer ${token}`)
    .send(transactionDto)
    .expect(201);

  const { jobId } = response.body;
  const status = await waitForTransactionCompletion(app, jobId, token);

  if (status.status === "failed") {
    throw new Error(status.error || "Transaction failed");
  }
}
