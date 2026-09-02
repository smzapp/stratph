import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { ValueTransformer } from 'typeorm';

// Entity decorators run at module-load time, before Nest's DI container
// exists, so this reads directly from the environment rather than going
// through ConfigService (same fallback pattern used for JWT_SECRET elsewhere).
const DEV_FALLBACK_SECRET = 'stratph-dev-message-key-change-me';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.MESSAGE_ENCRYPTION_KEY ?? DEV_FALLBACK_SECRET;
  return createHash('sha256').update(secret).digest();
}

// Transparently encrypts a text column at rest (AES-256-GCM) so message
// content isn't stored in the database in plaintext. Application code never
// sees ciphertext — TypeORM applies `to`/`from` on every write/read.
export const encryptedTextTransformer: ValueTransformer = {
  to(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  },
  from(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    try {
      const raw = Buffer.from(value, 'base64');
      const iv = raw.subarray(0, IV_LENGTH);
      const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
      const encrypted = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
      const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
      return decrypted.toString('utf8');
    } catch {
      // Rows written before this column was encrypted are still plain text —
      // fall back to the raw value instead of throwing, so existing data
      // keeps working until it's next written (and re-encrypted).
      return value;
    }
  },
};
