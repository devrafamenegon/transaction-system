import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../entities/transaction.entity';

@Injectable()
export class TransactionRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['sourceAccount', 'destinationAccount'],
    });
  }

  async findAll(): Promise<Transaction[]> {
    return this.repository.find({
      relations: ['sourceAccount', 'destinationAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: [
        { sourceAccount: { id: accountId } },
        { destinationAccount: { id: accountId } },
      ],
      relations: ['sourceAccount', 'destinationAccount'],
      order: { createdAt: 'DESC' },
    });
  }
}