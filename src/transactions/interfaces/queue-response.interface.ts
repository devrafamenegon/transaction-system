import { Transaction } from "../entities/transaction.entity";

export interface QueueJobResponse {
  jobId: string;
}

export interface JobStatus {
  status:
    | "completed"
    | "failed"
    | "waiting"
    | "active"
    | "delayed"
    | "paused"
    | "not_found";
  data?: Transaction;
  error?: string;
}
