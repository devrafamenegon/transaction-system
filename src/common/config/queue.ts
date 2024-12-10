import { registerAs } from "@nestjs/config";
import { QueueConfig } from "../interfaces/config.interface";

export default registerAs(
  "queue",
  (): QueueConfig => ({
    attempts: parseInt(process.env.QUEUE_JOB_ATTEMPTS ?? "3", 10),
    backoffDelay: parseInt(process.env.QUEUE_BACKOFF_DELAY ?? "1000", 10),
    removeOnComplete: process.env.QUEUE_REMOVE_ON_COMPLETE === "true",
    removeOnFail: process.env.QUEUE_REMOVE_ON_FAIL === "false",
  })
);
