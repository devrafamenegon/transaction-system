export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    latency: number;
  };
}
