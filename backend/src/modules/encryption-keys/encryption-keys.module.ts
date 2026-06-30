import { Controller, Get, Module, UseGuards } from '@nestjs/common';
import { SequelizeModule, InjectModel } from '@nestjs/sequelize';
import { EncryptionKey } from './models/encryption-key.model';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CryptoService } from '../crypto/crypto.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('encryption-keys')
export class EncryptionKeysController {
  constructor(
    @InjectModel(EncryptionKey) private model: typeof EncryptionKey,
    private crypto: CryptoService,
  ) {}

  // Lists known key versions + which one is currently active (from env), for audit/rotation tracking.
  @Get()
  async list() {
    const rows = await this.model.findAll({ order: [['created_at', 'DESC']] });
    return { activeVersion: this.crypto.keyVersion, history: rows };
  }
}

@Module({
  imports: [SequelizeModule.forFeature([EncryptionKey])],
  controllers: [EncryptionKeysController],
})
export class EncryptionKeysModule {}
