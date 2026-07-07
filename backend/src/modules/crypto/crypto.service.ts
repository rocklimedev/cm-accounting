import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedPayload {
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64
  keyVersion: string;
}

@Injectable()
export class CryptoService {
  private readonly keys: Map<string, Buffer>;
  private readonly activeKey: Buffer;
  readonly keyVersion: string;
  readonly keyFingerprint: string;
  readonly keyFingerprints: Record<string, string>;

  constructor(private config: ConfigService) {
    this.keys = this.loadKeys();
    this.keyVersion =
      this.config.get<string>('ENCRYPTION_ACTIVE_KEY_VERSION') ??
      this.config.get<string>('ENCRYPTION_KEY_VERSION') ??
      'v1';

    const activeKey = this.keys.get(this.keyVersion);
    if (!activeKey) {
      throw new Error(
        `Active encryption key version "${this.keyVersion}" is not configured`,
      );
    }
    this.activeKey = activeKey;
    this.keyFingerprints = Object.fromEntries(
      [...this.keys.entries()].map(([version, key]) => [
        version,
        this.fingerprint(key),
      ]),
    );
    this.keyFingerprint = this.keyFingerprints[this.keyVersion];
  }

  /** Encrypts plaintext (e.g. remarks) using AES-256-GCM. */
  encrypt(plaintext: string): EncryptedPayload {
    const iv = crypto.randomBytes(12);
    const cipherFn = crypto.createCipheriv('aes-256-gcm', this.activeKey, iv);
    const encrypted = Buffer.concat([
      cipherFn.update(plaintext, 'utf8'),
      cipherFn.final(),
    ]);
    const tag = cipherFn.getAuthTag();

    return {
      cipher: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      keyVersion: this.keyVersion,
    };
  }

  /** Decrypts a payload produced by encrypt(). Returns null fields => null plaintext. */
  decrypt(payload: Partial<EncryptedPayload>): string | null {
    if (!payload?.cipher || !payload?.iv || !payload?.tag) return null;
    const keyVersion = payload.keyVersion ?? this.keyVersion;
    const key = this.keys.get(keyVersion);

    if (!key) {
      throw new Error(`Encryption key version "${keyVersion}" is not configured`);
    }

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(payload.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.cipher, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  /** HMAC-SHA256 signature over a canonical JSON representation of a record. */
  sign(data: Record<string, any>): string {
    const canonical = JSON.stringify(this.sortKeys(data));
    return crypto
      .createHmac('sha256', this.activeKey)
      .update(canonical)
      .digest('hex');
  }

  verify(data: Record<string, any>, signature: string): boolean {
    const expected = this.sign(data);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }

  /** SHA-256 hash chain link: hash(previousHash + canonical(data)). Used for tamper-evident
   * append-only logs (sales_reports.previous_hash, daily_closing.hash). */
  chainHash(previousHash: string | null, data: Record<string, any>): string {
    const canonical = JSON.stringify(this.sortKeys(data));
    return crypto
      .createHash('sha256')
      .update((previousHash ?? '') + canonical)
      .digest('hex');
  }

  private sortKeys(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
      }, {} as Record<string, any>);
  }

  private loadKeys(): Map<string, Buffer> {
    const keys = new Map<string, Buffer>();
    const jsonKeys = this.config.get<string>('ENCRYPTION_KEYS_JSON');

    if (jsonKeys) {
      let parsed: Record<string, string>;

      try {
        parsed = JSON.parse(jsonKeys);
      } catch {
        throw new Error('ENCRYPTION_KEYS_JSON must be a JSON object');
      }

      for (const [version, hexKey] of Object.entries(parsed)) {
        keys.set(
          version,
          this.parseHexKey(hexKey, `ENCRYPTION_KEYS_JSON.${version}`),
        );
      }
    }

    const legacyKey = this.config.get<string>('ENCRYPTION_KEY');
    if (legacyKey) {
      const legacyVersion =
        this.config.get<string>('ENCRYPTION_KEY_VERSION') ?? 'v1';
      keys.set(legacyVersion, this.parseHexKey(legacyKey, 'ENCRYPTION_KEY'));
    }

    if (!keys.size) {
      throw new Error(
        'Configure ENCRYPTION_KEY or ENCRYPTION_KEYS_JSON for AES-256-GCM',
      );
    }

    return keys;
  }

  private parseHexKey(hexKey: string, source: string): Buffer {
    if (!/^[0-9a-fA-F]{64}$/.test(hexKey)) {
      throw new Error(
        `${source} must be a 64-character hex string (32 bytes) for AES-256-GCM`,
      );
    }

    return Buffer.from(hexKey, 'hex');
  }

  private fingerprint(key: Buffer): string {
    return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
  }
}
