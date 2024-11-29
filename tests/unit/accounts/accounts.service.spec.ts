import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from '../../../src/accounts/accounts.service';
import { AccountRepository } from '../../../src/accounts/repositories/account.repository';
import { UserRepository } from '../../../src/auth/repositories/user.repository';
import { LoggerService } from '../../../src/common/logger/logger.service';
import { Account } from '../../../src/accounts/entities/account.entity';
import { User } from '../../../src/auth/entities/user.entity';
import { CreateAccountDto } from '../../../src/accounts/dto/create-account.dto';
import { ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AccountsService', () => {
  let service: AccountsService;
  let accountRepository: jest.Mocked<AccountRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    accounts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAccount: Account = {
    id: '456',
    accountNumber: '1234567890',
    balance: 1000,
    users: [mockUser],
    isSharedAccount: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: AccountRepository,
          useValue: {
            findByNumber: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
            findByIds: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            warn: jest.fn(),
            logAccountActivity: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    accountRepository = module.get(AccountRepository);
    userRepository = module.get(UserRepository);
    loggerService = module.get(LoggerService);
  });

  describe('create', () => {
    const createAccountDto: CreateAccountDto = {
      accountNumber: '1234567890',
      userId: '123',
      isSharedAccount: false,
    };

    it('should successfully create an account', async () => {
      accountRepository.findByNumber.mockResolvedValue(null);
      userRepository.findById.mockResolvedValue(mockUser);
      accountRepository.create.mockResolvedValue(mockAccount);

      const result = await service.create(createAccountDto);

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findByNumber).toHaveBeenCalledWith(createAccountDto.accountNumber);
      expect(userRepository.findById).toHaveBeenCalledWith(createAccountDto.userId);
      expect(accountRepository.create).toHaveBeenCalled();
      expect(loggerService.logAccountActivity).toHaveBeenCalled();
    });

    it('should throw ConflictException if account number exists', async () => {
      accountRepository.findByNumber.mockResolvedValue(mockAccount);

      await expect(service.create(createAccountDto)).rejects.toThrow(ConflictException);
      expect(accountRepository.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if primary user not found', async () => {
      accountRepository.findByNumber.mockResolvedValue(null);
      userRepository.findById.mockResolvedValue(null);

      await expect(service.create(createAccountDto)).rejects.toThrow(NotFoundException);
      expect(accountRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByNumber', () => {
    it('should return an account when found', async () => {
      accountRepository.findByNumber.mockResolvedValue(mockAccount);

      const result = await service.findByNumber('1234567890');

      expect(result).toEqual(mockAccount);
      expect(accountRepository.findByNumber).toHaveBeenCalledWith('1234567890');
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findByNumber.mockResolvedValue(null);

      await expect(service.findByNumber('1234567890')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateUserAccess', () => {
    it('should return true when user has access', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      const result = await service.validateUserAccess(mockUser.id, mockAccount.id);

      expect(result).toBe(true);
      expect(accountRepository.findById).toHaveBeenCalledWith(mockAccount.id);
    });

    it('should throw ForbiddenException when user does not have access', async () => {
      accountRepository.findById.mockResolvedValue(mockAccount);

      await expect(service.validateUserAccess('wrongUserId', mockAccount.id))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when account not found', async () => {
      accountRepository.findById.mockResolvedValue(null);

      await expect(service.validateUserAccess(mockUser.id, 'wrongAccountId'))
        .rejects.toThrow(NotFoundException);
    });
  });
});