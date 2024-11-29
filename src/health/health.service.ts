import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { HealthCheckResponse } from "./interfaces/health-check-response.interface";
import { LoggerService } from "../common/logger/logger.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly logger: LoggerService
  ) {}

  async check(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    const status: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: await this.checkDatabase(),
    };

    this.logger.debug(
      `Health check completed in ${Date.now() - startTime}ms`,
      "HealthService"
    );

    return status;
  }

  private async checkDatabase(): Promise<{ status: string; latency: number }> {
    const startTime = Date.now();
    try {
      await this.dataSource.query("SELECT 1");
      return {
        status: "connected",
        latency: Date.now() - startTime,
      };
    } catch (error: any) {
      this.logger.error(
        `Database health check failed: ${error.message}`,
        error.stack,
        "HealthService"
      );
      return {
        status: "disconnected",
        latency: Date.now() - startTime,
      };
    }
  }
}
