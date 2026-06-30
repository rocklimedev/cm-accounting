import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DebtorTransaction } from './models/debtor-transaction.model';
import { CreateDebtorTransactionDto } from './dto/create-debtor-transaction.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DebtorService {
  constructor(
    @InjectModel(DebtorTransaction) private model: typeof DebtorTransaction,
    private auditService: AuditService,
  ) {}

  findAll(customer_name?: string) {
    const where: any = {};
    if (customer_name) where.customer_name = customer_name;
    return this.model.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async findOne(id: string) {
    const tx = await this.model.findByPk(id);
    if (!tx) throw new NotFoundException('Debtor transaction not found');
    return tx;
  }

  async getBalance(customer_name: string) {
    const txs = await this.model.findAll({ where: { customer_name } });
    const balance = txs.reduce((sum, tx) => {
      if (tx.type === 'PAYMENT') return sum - Number(tx.amount);
      return sum + Number(tx.amount); // NEW and ADJUSTMENT increase/decrease per amount sign
    }, 0);
    return { customer_name, balance };
  }

  async create(dto: CreateDebtorTransactionDto, userId: string) {
    const tx = await this.model.create({ ...dto } as any);
    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'debtor_transactions',
      recordId: tx.id,
      newValue: tx.toJSON(),
    });
    return tx;
  }
}
