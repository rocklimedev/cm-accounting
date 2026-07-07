import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateBankTransactionDto } from './dto/create-bank-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('bank')
export class BankController {
  constructor(private bankService: BankService) {}

  @Get()
  findAll() {
    return this.bankService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bankService.findOne(id);
  }

  @Post()
  create(
    @Body() dto: CreateBankTransactionDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.bankService.create(dto, userId);
  }
}
