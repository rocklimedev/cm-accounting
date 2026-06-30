import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LedgerEntry } from './models/ledger-entry.model';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(LedgerEntry) private ledgerModel: typeof LedgerEntry,
    private auditService: AuditService,
  ) {}

  findAll(filters: { from?: string; to?: string; account_name?: string }) {
    const where: any = {};
    if (filters.account_name) where.account_name = filters.account_name;
    if (filters.from || filters.to) {
      where.entry_date = {};
      if (filters.from) where.entry_date.$gte = filters.from;
      if (filters.to) where.entry_date.$lte = filters.to;
    }
    return this.ledgerModel.findAll({ where, order: [['entry_date', 'DESC']] });
  }

  async findOne(id: string) {
    const entry = await this.ledgerModel.findByPk(id);
    if (!entry) throw new NotFoundException('Ledger entry not found');
    return entry;
  }

  async create(dto: CreateLedgerEntryDto, userId: string) {
    const entry = await this.ledgerModel.create({
      ...dto,
      created_by: userId,
    } as any);
    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'ledger_entries',
      recordId: entry.id,
      newValue: entry.toJSON(),
    });
    return entry;
  }

  // Ledger entries are append-only for audit integrity — no update/delete is exposed.
  // Corrections must be made via an offsetting reversal entry instead.
  async reverse(id: string, userId: string) {
    const original = await this.findOne(id);
    const reversalType = original.entry_type === 'DEBIT' ? 'CREDIT' : 'DEBIT';
    const reversal = await this.ledgerModel.create({
      entry_date: new Date().toISOString().slice(0, 10),
      account_name: original.account_name,
      entry_type: reversalType,
      amount: original.amount,
      reference_type: 'REVERSAL',
      reference_id: original.id,
      description: `Reversal of entry ${original.id}`,
      created_by: userId,
    } as any);

    await this.auditService.log({
      userId,
      action: 'REVERSE',
      tableName: 'ledger_entries',
      recordId: reversal.id,
      oldValue: original.toJSON(),
      newValue: reversal.toJSON(),
    });
    return reversal;
  }
}
