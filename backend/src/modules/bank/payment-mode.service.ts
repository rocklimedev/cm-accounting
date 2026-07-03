import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { PaymentMode } from './models/payment-mode.model';
import { AuditService } from '../audit/audit.service';
import { CreatePaymentModeDto } from './dto/create-payment-mode.dto';

@Injectable()
export class PaymentModeService {
  constructor(
    @InjectModel(PaymentMode)
    private readonly paymentModeModel: typeof PaymentMode,

    private readonly auditService: AuditService,
  ) {}

  async findAll() {
    return this.paymentModeModel.findAll({
      order: [['name', 'ASC']],
    });
  }

  async findActive() {
    return this.paymentModeModel.findAll({
      where: {
        is_active: true,
      },
      order: [['name', 'ASC']],
    });
  }

  async findOne(id: string) {
    const paymentMode = await this.paymentModeModel.findByPk(id);

    if (!paymentMode) {
      throw new NotFoundException('Payment mode not found');
    }

    return paymentMode;
  }

  async create(dto: CreatePaymentModeDto, userId: string) {
    const exists = await this.paymentModeModel.findOne({
      where: {
        code: dto.code,
      },
    });

    if (exists) {
      throw new BadRequestException('Payment mode already exists');
    }

    const paymentMode = await this.paymentModeModel.create({
      ...dto,
      is_active: dto.is_active ?? true,
    } as any);

    await this.auditService.log({
      userId,
      action: 'CREATE',
      tableName: 'payment_modes',
      recordId: paymentMode.id,
      newValue: paymentMode.toJSON(),
    });

    return paymentMode;
  }

  async update(id: string, dto: CreatePaymentModeDto, userId: string) {
    const paymentMode = await this.findOne(id);

    const oldValue = paymentMode.toJSON();

    await paymentMode.update(dto);

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      tableName: 'payment_modes',
      recordId: paymentMode.id,
      oldValue,
      newValue: paymentMode.toJSON(),
    });

    return paymentMode;
  }

  async delete(id: string, userId: string) {
    const paymentMode = await this.findOne(id);

    await paymentMode.destroy();

    await this.auditService.log({
      userId,
      action: 'DELETE',
      tableName: 'payment_modes',
      recordId: id,
      oldValue: paymentMode.toJSON(),
    });

    return {
      message: 'Payment mode deleted successfully',
    };
  }
}
