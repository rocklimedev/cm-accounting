import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedPayload {
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64
}

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  readonly keyVersion: string;

  constructor(private config: ConfigService) {
    const hexKey = this.config.get<string>('ENCRYPTION_KEY');
    if (!hexKey || hexKey.length !== 64) {
      throw new Error(
        'ENCRYPTION_KEY must be a 64-character hex string (32 bytes) for AES-256-GCM',
      );
    }
    this.key = Buffer.from(hexKey, 'hex');
    this.keyVersion = this.config.get<string>('ENCRYPTION_KEY_VERSION') ?? 'v1';
  }

  /** Encrypts plaintext (e.g. remarks) using AES-256-GCM. */
  encrypt(plaintext: string): EncryptedPayload {
    const iv = crypto.randomBytes(12);
    const cipherFn = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipherFn.update(plaintext, 'utf8'),
      cipherFn.final(),
    ]);
    const tag = cipherFn.getAuthTag();

    return {
      cipher: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  /** Decrypts a payload produced by encrypt(). Returns null fields => null plaintext. */
  decrypt(payload: Partial<EncryptedPayload>): string | null {
    if (!payload?.cipher || !payload?.iv || !payload?.tag) return null;

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.key,
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
    return crypto.createHmac('sha256', this.key).update(canonical).digest('hex');
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
}
