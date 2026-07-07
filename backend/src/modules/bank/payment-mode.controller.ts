import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PaymentModeService } from './payment-mode.service';
import { CreatePaymentModeDto } from './dto/create-payment-mode.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ReconciliationService } from './reconcilation.service'; // Adjust path as needed
import { PaymentModeReportFilterDto } from './dto/payment-mode-report.dto'; // or from reconciliation/dto
@UseGuards(JwtAuthGuard)
@Controller('payment-modes')
export class PaymentModeController {
  constructor(
    private readonly paymentModeService: PaymentModeService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  @Get()
  findAll() {
    return this.paymentModeService.findAll();
  }

  @Get('active')
  findActive() {
    return this.paymentModeService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentModeService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePaymentModeDto, @CurrentUser('id') userId: string) {
    return this.paymentModeService.create(dto, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: CreatePaymentModeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentModeService.update(id, dto, userId);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.paymentModeService.delete(id, userId);
  }

  // ==================== RECONCILIATION REPORT ====================

  @Get('report/payment-modes')
  async getPaymentModeReport(@Query() filters: PaymentModeReportFilterDto) {
    return {
      success: true,
      data: await this.reconciliationService.generatePaymentModeReport(filters),
      timestamp: new Date().toISOString(),
    };
  }
}
