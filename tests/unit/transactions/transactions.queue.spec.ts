import { Test, TestingModule } from "@nestjs/testing";
import { Queue, Job } from "bull";
import { getQueueToken } from "@nestjs/bull";
import { TransactionQueue } from "../../../src/transactions/queues/transaction.queue";
import { LoggerService } from "../../../src/common/logger/logger.service";
import { TransactionType } from "../../../src/transactions/entities/transaction.entity";
import { CreateTransactionDto } from "../../../src/transactions/dto/create-transaction.dto";

describe("TransactionQueue", () => {
  let service: TransactionQueue;
  let queue: jest.Mocked<Queue>;
  let loggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionQueue,
        {
          provide: getQueueToken("transactions"),
          useValue: {
            add: jest.fn(),
            getJob: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionQueue>(TransactionQueue);
    queue = module.get(getQueueToken("transactions"));
    loggerService = module.get(LoggerService);
  });

  describe("addTransaction", () => {
    const transactionDto: CreateTransactionDto = {
      sourceAccountId: "123",
      amount: 100,
      type: TransactionType.DEPOSIT,
      description: "Test deposit",
    };

    it("should add transaction to queue successfully", async () => {
      const mockJob = { id: "job123" };
      queue.add.mockResolvedValue(mockJob as Job);

      const result = await service.addTransaction(transactionDto);

      expect(result).toEqual({ jobId: "job123" });
      expect(queue.add).toHaveBeenCalledWith(
        "process-transaction",
        transactionDto,
        expect.any(Object)
      );
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it("should handle queue errors", async () => {
      const error = new Error("Queue error");
      queue.add.mockRejectedValue(error);

      await expect(service.addTransaction(transactionDto)).rejects.toThrow(
        error
      );
    });
  });

  describe("getJobStatus", () => {
    const jobId = "job123";

    it("should return job status when job exists", async () => {
      const mockJob = {
        id: jobId,
        getState: jest.fn().mockResolvedValue("completed"),
        returnvalue: { success: true },
      };
      queue.getJob.mockResolvedValue(mockJob as unknown as Job);

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual({
        status: "completed",
        data: { success: true },
      });
    });

    it("should return not found status when job does not exist", async () => {
      queue.getJob.mockResolvedValue(null);

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual({ status: "not_found" });
    });

    it("should include error message for failed jobs", async () => {
      const mockJob = {
        id: jobId,
        getState: jest.fn().mockResolvedValue("failed"),
        failedReason: "Transaction failed",
        returnvalue: null,
      };
      queue.getJob.mockResolvedValue(mockJob as unknown as Job);

      const result = await service.getJobStatus(jobId);

      expect(result).toEqual({
        status: "failed",
        data: null,
        error: "Transaction failed",
      });
    });
  });
});
