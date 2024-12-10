import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { setupTestApp, closeTestApp } from "./jest-setup";

describe("Rate Limiting (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it("should allow requests within rate limit", async () => {
    // Make multiple requests within the limit
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(401); // Expect 401 since credentials are invalid, but not rate limited
    }
  }, 20000);

  it("should block requests when exceeding rate limit", async () => {
    // Make requests to exceed the rate limit
    const requests = Array(61)
      .fill(null)
      .map(() =>
        request(app.getHttpServer()).post("/api/auth/login").send({
          email: "test@example.com",
          password: "password123",
        })
      );

    const responses = await Promise.all(requests);

    // Check if at least one request was rate limited (429 Too Many Requests)
    const rateLimitedResponses = responses.filter((res) => res.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  }, 20000);

  it("should reset rate limit after window expires", async () => {
    // Wait for rate limit window to expire (10 seconds)
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Try another request, should succeed (not be rate limited)
    await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      })
      .expect(401); // Expect 401, not 429
  }, 20000);
});
