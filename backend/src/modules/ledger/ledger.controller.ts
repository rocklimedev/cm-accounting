import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  // Both ADMIN and ACCOUNTANT can view + post ledger entries
  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get()
  findAll(@Query('from') from?: string, @Query('to') to?: string, @Query('account_name') account_name?: string) {
    return this.ledgerService.findAll({ from, to, account_name });
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ledgerService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.ACCOUNTANT)
  @Post()
  create(@Body() dto: CreateLedgerEntryDto, @CurrentUser('userId') userId: string) {
    return this.ledgerService.create(dto, userId);
  }

  // Only ADMIN can reverse a posted ledger entry
  @Roles(Role.ADMIN)
  @Post(':id/reverse')
  reverse(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.ledgerService.reverse(id, userId);
  }
}
