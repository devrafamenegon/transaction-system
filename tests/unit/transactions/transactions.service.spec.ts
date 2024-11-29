import { Test, TestingModule } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { TransactionsService } from "../../../src/transactions/transactions.service";
import { TransactionRepository } from "../../../src/transactions/repositories/transaction.repository";
import { AccountRepository } from "../../../src/accounts/repositories/account.repository";
import { AccountsService } from "../../../src/accounts/accounts.service";
import { TransactionLogsService } from "../../../src/transaction-logs/transaction-logs.service";
import { LoggerService } from "../../../src/common/logger/logger.service";
import {
  Transaction,
  TransactionType,
} from "../../../src/transactions/entities/transaction.entity";
import { Account } from "../../../src/accounts/entities/account.entity";
import { CreateTransactionDto } from "../../../src/transactions/dto/create-transaction.dto";
import {
  InsufficientFundsException,
  InvalidTransactionException,
} from "../../../src/common/exceptions/business.exception";

describe("TransactionsService", () => {
  let service: TransactionsService;
  let transactionRepository: jest.Mocked<TransactionRepository>;
  let accountRepository: jest.Mocked<AccountRepository>;
  let accountsService: jest.Mocked<AccountsService>;
  let transactionLogsService: jest.Mocked<TransactionLogsService>;
  let loggerService: jest.Mocked<LoggerService>;
  let dataSource: jest.Mocked<DataSource>;

  const mockAccount: Account = {
    id: "123",
    accountNumber: "1234567890",
    balance: 1000,
    users: [],
    isSharedAccount: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction: Transaction = {
    id: "456",
    sourceAccount: mockAccount,
    destinationAccount: null,
    amount: 100,
    type: TransactionType.DEPOSIT,
    createdAt: new Date(),
    description: "Test transaction",
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      save: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: TransactionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            findByAccountId: jest.fn(),
          },
        },
        {
          provide: AccountRepository,
          useValue: {
            updateBalance: jest.fn(),
          },
        },
        {
          provide: AccountsService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: TransactionLogsService,
          useValue: {
            createLog: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
            logTransaction: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get(TransactionRepository);
    accountRepository = module.get(AccountRepository);
    accountsService = module.get(AccountsService);
    transactionLogsService = module.get(TransactionLogsService);
    loggerService = module.get(LoggerService);
    dataSource = module.get(DataSource);
  });

  describe("create", () => {
    const createTransactionDto: CreateTransactionDto = {
      sourceAccountId: "123",
      amount: 100,
      type: TransactionType.DEPOSIT,
      description: "Test deposit",
    };

    beforeEach(() => {
      accountsService.findById.mockResolvedValue(mockAccount);
      transactionRepository.create.mockResolvedValue(mockTransaction);
      accountRepository.updateBalance.mockResolvedValue({
        ...mockAccount,
        balance: 1100,
      });
    });

    it("should successfully create a deposit transaction", async () => {
      const result = await service.create(createTransactionDto);

      expect(result).toEqual(mockTransaction);
      expect(accountRepository.updateBalance).toHaveBeenCalledWith(
        mockAccount.id,
        createTransactionDto.amount,
        false
      );
      expect(transactionLogsService.createLog).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it("should throw InsufficientFundsException for withdrawal with insufficient balance", async () => {
      const withdrawalDto = {
        ...createTransactionDto,
        type: TransactionType.WITHDRAWAL,
        amount: 2000,
      };

      await expect(service.create(withdrawalDto)).rejects.toThrow(
        InsufficientFundsException
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it("should throw InvalidTransactionException for transfer without destination account", async () => {
      const transferDto = {
        ...createTransactionDto,
        type: TransactionType.TRANSFER,
      };

      await expect(service.create(transferDto)).rejects.toThrow(
        InvalidTransactionException
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it("should handle transaction rollback on error", async () => {
      accountRepository.updateBalance.mockRejectedValue(
        new Error("Database error")
      );

      await expect(service.create(createTransactionDto)).rejects.toThrow();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return a transaction when found", async () => {
      transactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await service.findById("456");

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findById).toHaveBeenCalledWith("456");
    });

    it("should throw NotFoundException when transaction not found", async () => {
      transactionRepository.findById.mockResolvedValue(null);

      await expect(service.findById("456")).rejects.toThrow();
    });
  });
});
