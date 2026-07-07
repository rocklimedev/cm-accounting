import { Controller, Get, Module, Post, UseGuards } from '@nestjs/common';
import { SequelizeModule, InjectModel } from '@nestjs/sequelize';
import { EncryptionKey } from './models/encryption-key.model';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CryptoService } from '../crypto/crypto.service';

@UseGuards(JwtAuthGuard)
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
    const history = rows.map((row) => row.toJSON());
    const activeRecord = history.find(
      (row) => row.key_version === this.crypto.keyVersion,
    );
    const configuredKeys = Object.entries(this.crypto.keyFingerprints).map(
      ([version, fingerprint]) => ({
        version,
        fingerprint,
        active: version === this.crypto.keyVersion,
        recorded: history.some((row) => row.key_version === version),
      }),
    );

    return {
      activeVersion: this.crypto.keyVersion,
      activeFingerprint: this.crypto.keyFingerprint,
      activeRecorded: Boolean(activeRecord),
      activeRecord: activeRecord ?? null,
      configuredKeys,
      history,
    };
  }

  @Post('record-active')
  async recordActive() {
    const [record] = await this.model.findOrCreate({
      where: { key_version: this.crypto.keyVersion },
      defaults: {
        key_version: this.crypto.keyVersion,
        key_fingerprint: this.crypto.keyFingerprint,
        status: 'active',
        algorithm: 'aes-256-gcm',
        activated_at: new Date(),
        notes: 'Recorded from server configuration',
      } as any,
    });

    await record.update({
      key_fingerprint: this.crypto.keyFingerprint,
      status: 'active',
      algorithm: 'aes-256-gcm',
      activated_at: record.activated_at ?? new Date(),
    });

    return record.toJSON();
  }
}

@Module({
  imports: [SequelizeModule.forFeature([EncryptionKey])],
  controllers: [EncryptionKeysController],
})
export class EncryptionKeysModule {}
