import crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppCryptoCreateHashAlgorithm,
  AppCryptoCreateHashOptions,
} from './app-crypto.interface';
import { AppEnv } from '/@/common/validation/app-env.validation';

const IV_LENGTH: number = 16; // For AES, this is always 16

@Injectable()
export class AppCryptoService {
  constructor(private config: ConfigService<AppEnv, true>) {}

  encryptString(str: string, keyHex?: string) {
    const iv = crypto.randomBytes(IV_LENGTH); // Directly use Buffer returned by randomBytes
    const key = crypto
      .createHash('sha256')
      .update(keyHex || this.config.get('SECRET_DATA_KEY'))
      .digest();

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(str, 'utf8'),
      cipher.final(),
    ]);

    // Return iv and encrypted data as hex, combined in one line
    return Buffer.from(iv.toString('hex') + ':' + encrypted.toString('hex'));
  }

  decryptString(string: string, keyHex?: string): string {
    const [ivHex, encryptedHex] = string.split(':');
    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid or corrupted cipher format');
    }

    const key = crypto
      .createHash('sha256')
      .update(keyHex || this.config.get('SECRET_DATA_KEY'))
      .digest();
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      key,
      Buffer.from(ivHex, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString();
  }

  createHash(
    algorithm: AppCryptoCreateHashAlgorithm,
    data: string,
    options?: AppCryptoCreateHashOptions,
  ) {
    return crypto
      .createHash(algorithm, { outputLength: options?.outputLength })
      .update(data)
      .digest(options?.digest ?? 'hex');
  }
}
