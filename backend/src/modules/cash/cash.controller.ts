import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CashService } from './cash.service';

import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto';
import { CreateCashOpeningDto } from './dto/create-cash-opening.dto';
import { CreateCashAdjustmentDto } from './dto/create-cash-adjustment.dto';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  // ============================
  // Cash Transactions
  // ============================

  @Get('transactions')
  findAllTransactions() {
    return this.cashService.findAll();
  }

  @Get('transactions/:id')
  findTransaction(@Param('id') id: string) {
    return this.cashService.findOne(id);
  }

  @Post('transactions')
  createTransaction(
    @Body() dto: CreateCashTransactionDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.cashService.createTransaction(dto, userId);
  }

  // ============================
  // Cash Opening
  // ============================

  @Post('openings')
  createCashOpening(
    @Body() body: any, // ← accept raw body first
    @CurrentUser('userId') userId: string,
  ) {
    // Transform date -> openingDate
    const dto: CreateCashOpeningDto = {
      openingDate: body.date || body.openingDate,
      amount: body.amount,
      previousAmount: body.previousAmount,
      reason: body.reason,
    };

    return this.cashService.createCashOpening(dto, userId);
  }

  @Get('openings/latest')
  getLatestOpening() {
    return this.cashService.getLatestOpening();
  }

  @Get('openings')
  getOpening(@Query('date') date: string) {
    return this.cashService.getOpening(date);
  }

  // ============================
  // Cash Adjustments
  // ============================

  @Post('adjustments')
  createCashAdjustment(
    @Body() body: any, // Accept raw body
    @CurrentUser('userId') userId: string,
  ) {
    // Transform 'date' -> 'adjustmentDate'
    const dto: CreateCashAdjustmentDto = {
      adjustmentDate: body.date || body.adjustmentDate,
      type: body.type,
      amount: body.amount,
      reason: body.reason,
    };

    return this.cashService.createCashAdjustment(dto, userId);
  }
  @Get('adjustments')
  getAdjustments(@Query('date') date: string) {
    return this.cashService.getAdjustments(date);
  }

  // ============================
  // Daily Summary
  // ============================

  @Get('summary')
  getDailySummary(@Query('date') date: string) {
    return this.cashService.getDailySummary(date);
  }
}
