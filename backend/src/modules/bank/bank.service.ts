import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BankTransaction } from './models/bank-transaction.model';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class BankService {
  constructor(
    @InjectModel(BankTransaction) private model: typeof BankTransaction,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.model.findAll({ order: [['created_at', 'DESC']] });
  }

  async findOne(id: string) {
    const tx = await this.model.findByPk(id);
    if (!tx) throw new NotFoundException('Bank transaction not found');
    return tx;
  }

  async create(dto: CreateBankTransactionDto, userId: string) {
    const tx = await this.model.create({ ...dto } as any);
    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'bank_transactions',
      recordId: tx.id,
      newValue: tx.toJSON(),
    });
    return tx;
  }
}
