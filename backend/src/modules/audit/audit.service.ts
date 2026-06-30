import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { AuditLog } from './models/audit-log.model';
@Injectable()
export class AuditService {
  constructor(@InjectModel(AuditLog) private auditModel: typeof AuditLog) {}

  async log(params: {
    userId?: string;
    action: string;
    tableName: string;
    recordId?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
  }) {
    return this.auditModel.create({
      user_id: params.userId ?? null,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      ip_address: params.ipAddress ?? null,
    } as any);
  }
}
