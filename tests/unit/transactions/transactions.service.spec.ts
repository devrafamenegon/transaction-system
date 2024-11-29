import { Test, TestingModule } from "@nestjs/testing";
import { TransactionsService } from "../../../src/transactions/transactions.service";
import { TransactionRepository } from "../../../src/transactions/repositories/transaction.repository";
import { LoggerService } from "../../../src/common/logger/logger.service";
import {
  Transaction,
  TransactionType,
} from "../../../src/transactions/entities/transaction.entity";
import { CreateTransactionDto } from "../../../src/transactions/dto/create-transaction.dto";
import { AppException } from "../../../src/common/exceptions/app.exception";
import { JobStatus } from "../../../src/transactions/interfaces/queue-response.interface";
import { TransactionQueue } from "../../../src/transactions/queues/transaction.queue";

describe("TransactionsService", () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let transactionQueue: jest.Mocked<TransactionQueue>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockTransaction: Transaction = {
    id: "456",
    sourceAccount: {
      id: "123",
      accountNumber: "1234567890",
      balance: 1000,
      users: [],
      isSharedAccount: false,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    destinationAccount: null,
    amount: 100,
    type: TransactionType.DEPOSIT,
    createdAt: new Date(),
    description: "Test transaction",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
            findByAccountId: jest.fn(),
          },
        },
        {
          provide: TransactionQueue,
          useValue: {
            addTransaction: jest.fn(),
            getJobStatus: jest.fn(),
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

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get(TransactionRepository);
    transactionQueue = module.get(TransactionQueue);
    loggerService = module.get(LoggerService);
  });

  describe("create", () => {
    const createTransactionDto: CreateTransactionDto = {
      sourceAccountId: "123",
      amount: 100,
      type: TransactionType.DEPOSIT,
      description: "Test deposit",
    };

    it("should add transaction to queue successfully", async () => {
      const mockJobId = "job123";
      transactionQueue.addTransaction.mockResolvedValue({ jobId: mockJobId });

      const result = await service.create(createTransactionDto);

      expect(result).toEqual({ jobId: mockJobId });
      expect(transactionQueue.addTransaction).toHaveBeenCalledWith(
        createTransactionDto
      );
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it("should handle queue errors", async () => {
      const error = new Error("Queue error");
      transactionQueue.addTransaction.mockRejectedValue(error);

      await expect(service.create(createTransactionDto)).rejects.toThrow(error);
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe("getTransactionStatus", () => {
    const jobId = "job123";

    it("should return completed status", async () => {
      const mockStatus: JobStatus = {
        status: "completed",
        data: mockTransaction,
      };
      transactionQueue.getJobStatus.mockResolvedValue(mockStatus);

      const result = await service.getTransactionStatus(jobId);

      expect(result).toEqual(mockStatus);
      expect(transactionQueue.getJobStatus).toHaveBeenCalledWith(jobId);
    });

    it("should return failed status with error", async () => {
      const mockStatus: JobStatus = {
        status: "failed",
        error: "Transaction failed",
      };
      transactionQueue.getJobStatus.mockResolvedValue(mockStatus);

      const result = await service.getTransactionStatus(jobId);

      expect(result).toEqual(mockStatus);
    });

    it("should return not found status", async () => {
      const mockStatus: JobStatus = { status: "not_found" };
      transactionQueue.getJobStatus.mockResolvedValue(mockStatus);

      const result = await service.getTransactionStatus(jobId);

      expect(result).toEqual(mockStatus);
    });
  });

  describe("findById", () => {
    it("should return a transaction when found", async () => {
      transactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await service.findById("456");

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findById).toHaveBeenCalledWith("456");
    });

    it("should throw AppException when transaction not found", async () => {
      transactionRepository.findById.mockResolvedValue(null);

      await expect(service.findById("456")).rejects.toThrow(AppException);
    });
  });
});
