import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { databaseConfig } from './config/database.config';

import { CryptoModule } from './modules/crypto/crypto.module';
import { AuditModule } from './modules/audit/audit.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { CashModule } from './modules/cash/cash.module';
import { BankModule } from './modules/bank/bank.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { DebtorModule } from './modules/debtor/debtor.module';
import { DailyClosingModule } from './modules/daily-closing/daily-closing.module';
import { EncryptionKeysModule } from './modules/encryption-keys/encryption-keys.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { PaymentModeModule } from './modules/bank/payment-mode.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SearchModule } from './modules/search/search.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    CryptoModule,
    AuditModule,
    UsersModule,
    AuthModule,
    LedgerModule,
    CashModule,
    BankModule,
    SalesModule,
    ExpenseModule,
    DebtorModule,
    DailyClosingModule,
    EncryptionKeysModule,
    RbacModule,
    ReportsModule,
    PaymentModeModule,
    SearchModule,
  ],
})
export class AppModule {}
