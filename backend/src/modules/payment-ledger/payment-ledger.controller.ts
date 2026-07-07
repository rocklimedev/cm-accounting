import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentLedgerService } from './payment-ledger.service';
import { RecordOpeningDto } from './dto/record-opening.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('payment-ledger')
export class PaymentLedgerController {
  constructor(private readonly paymentLedgerService: PaymentLedgerService) {}

  @Post('opening')
  recordOpening(
    @Body() dto: RecordOpeningDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentLedgerService.recordOpening({
      paymentModeId: dto.paymentModeId,
      entryDate: dto.entryDate,
      amount: dto.amount,
      sourceType: 'MANUAL_OPENING',
      sourceId: dto.paymentModeId, // one opening per mode, so mode id is a safe unique sourceId
      description: dto.description ?? 'Opening balance',
      createdBy: userId,
    });
  }

  @Get('balances')
  getBalances(@Query('asOfDate') asOfDate?: string) {
    return this.paymentLedgerService.getBalances(asOfDate);
  }

  @Get('summary')
  getMovementSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('paymentModeId') paymentModeId?: string,
  ) {
    return this.paymentLedgerService.getMovementSummary({
      from,
      to,
      paymentModeId,
    });
  }
}
