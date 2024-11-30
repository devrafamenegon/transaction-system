import { Test, TestingModule } from "@nestjs/testing";
import { Job } from "bull";
import { TransactionProcessor } from "../../../src/transactions/processors/transaction.processor";
import { TransactionProcessorService } from "../../../src/transactions/services/transaction-processor.service";
import { AccountsService } from "../../../src/accounts/accounts.service";
import { TransactionValidatorService } from "../../../src/transactions/services/transaction-validator.service";
import { LoggerService } from "../../../src/common/logger/logger.service";
import { TransactionType } from "../../../src/transactions/entities/transaction.entity";
import { CreateTransactionDto } from "../../../src/transactions/dto/create-transaction.dto";
import { InvalidTransactionException } from "../../../src/common/exceptions/business.exception";

describe("TransactionProcessor", () => {
  let processor: TransactionProcessor;
  let transactionProcessorService: jest.Mocked<TransactionProcessorService>;
  let accountsService: jest.Mocked<AccountsService>;
  let transactionValidator: jest.Mocked<TransactionValidatorService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockSourceAccount = {
    id: "123",
    accountNumber: "1234567890",
    balance: 1000,
    users: [],
    isSharedAccount: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: "456",
    sourceAccount: mockSourceAccount,
    destinationAccount: null,
    amount: 100,
    type: TransactionType.DEPOSIT,
    createdAt: new Date(),
    description: "Test transaction",
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionProcessor,
        {
          provide: TransactionProcessorService,
          useValue: {
            processTransaction: jest.fn(),
          },
        },
        {
          provide: AccountsService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: TransactionValidatorService,
          useValue: {
            validateTransaction: jest.fn(),
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

    processor = module.get<TransactionProcessor>(TransactionProcessor);
    transactionProcessorService = module.get(TransactionProcessorService);
    accountsService = module.get(AccountsService);
    transactionValidator = module.get(TransactionValidatorService);
    loggerService = module.get(LoggerService);
  });

  describe("processTransaction", () => {
    const transactionDto: CreateTransactionDto = {
      sourceAccountId: "123",
      amount: 100,
      type: TransactionType.DEPOSIT,
      description: "Test deposit",
    };

    const mockJob = {
      id: "job123",
      data: transactionDto,
    } as Job<CreateTransactionDto>;

    beforeEach(() => {
      accountsService.findById.mockResolvedValue(mockSourceAccount);
      transactionProcessorService.processTransaction.mockResolvedValue(
        mockTransaction
      );
    });

    it("should process transaction successfully", async () => {
      const result = await processor.processTransaction(mockJob);

      expect(result).toEqual(mockTransaction);
      expect(accountsService.findById).toHaveBeenCalledWith(
        transactionDto.sourceAccountId
      );
      expect(transactionValidator.validateTransaction).toHaveBeenCalled();
      expect(transactionProcessorService.processTransaction).toHaveBeenCalled();
      expect(loggerService.debug).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const error = new InvalidTransactionException("Invalid transaction");
      transactionValidator.validateTransaction.mockImplementation(() => {
        throw error;
      });

      await expect(processor.processTransaction(mockJob)).rejects.toThrow(
        error
      );
      expect(loggerService.error).toHaveBeenCalled();
    });

    it("should handle processing errors", async () => {
      const error = new Error("Processing failed");
      transactionProcessorService.processTransaction.mockRejectedValue(error);

      await expect(processor.processTransaction(mockJob)).rejects.toThrow(
        error
      );
      expect(loggerService.error).toHaveBeenCalled();
    });

    it("should process transfer transaction with destination account", async () => {
      const transferDto: CreateTransactionDto = {
        ...transactionDto,
        type: TransactionType.TRANSFER,
        destinationAccountId: "456",
      };
      const mockDestAccount = { ...mockSourceAccount, id: "456" };
      const mockTransferJob = {
        id: "job456",
        data: transferDto,
      } as Job<CreateTransactionDto>;

      accountsService.findById
        .mockResolvedValueOnce(mockSourceAccount)
        .mockResolvedValueOnce(mockDestAccount);

      await processor.processTransaction(mockTransferJob);

      expect(accountsService.findById).toHaveBeenCalledWith(
        transferDto.destinationAccountId
      );
      expect(transactionValidator.validateTransaction).toHaveBeenCalledWith(
        transferDto,
        mockSourceAccount,
        mockDestAccount
      );
    });
  });
});
