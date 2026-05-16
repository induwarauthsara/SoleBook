import { TOTP, Secret } from 'otpauth';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.TOTP_ENCRYPTION_KEY || 'default-dev-key-change-in-production';
const ISSUER = 'SoleBook';

export function generateTOTPSecret(email: string): { secret: string; uri: string } {
  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });
  return {
    secret: secret.base32,
    uri: totp.toString(),
  };
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export function encryptSecret(secret: string): string {
  return CryptoJS.AES.encrypt(secret, ENCRYPTION_KEY).toString();
}

export function decryptSecret(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 8 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
    ).join('');
    codes.push(code);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  return CryptoJS.SHA256(code.toUpperCase()).toString();
}
