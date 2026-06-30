import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CashTransaction } from './models/cash-transaction.model';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CashService {
  constructor(
    @InjectModel(CashTransaction) private model: typeof CashTransaction,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.model.findAll({ order: [['created_at', 'DESC']] });
  }

  async findOne(id: string) {
    const tx = await this.model.findByPk(id);
    if (!tx) throw new NotFoundException('Cash transaction not found');
    return tx;
  }

  async create(dto: CreateCashTransactionDto, userId: string) {
    const tx = await this.model.create({ ...dto } as any);
    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'cash_transactions',
      recordId: tx.id,
      newValue: tx.toJSON(),
    });
    return tx;
  }
}
