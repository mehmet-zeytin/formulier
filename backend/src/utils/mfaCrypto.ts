import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
  const rawKey = process.env.MFA_ENCRYPTION_KEY;

  if (!rawKey) {
    throw new Error(
      'MFA_ENCRYPTION_KEY ontbreekt in de environment variables.'
    );
  }

  const key = Buffer.from(rawKey, 'base64');

  if (key.length !== 32) {
    throw new Error(
      'MFA_ENCRYPTION_KEY moet exact 32 bytes zijn.'
    );
  }

  return key;
}

export function encryptMfaSecret(
  secret: string
): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(
    ALGORITHM,
    key,
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64')
  ].join('.');
}

export function decryptMfaSecret(
  encryptedValue: string
): string {
  const key = getEncryptionKey();

  const parts = encryptedValue.split('.');

  if (parts.length !== 3) {
    throw new Error(
      'Ongeldig versleuteld MFA-secret.'
    );
  }

  const [
    ivBase64,
    authTagBase64,
    encryptedBase64
  ] = parts;

  const iv = Buffer.from(
    ivBase64,
    'base64'
  );

  const authTag = Buffer.from(
    authTagBase64,
    'base64'
  );

  const encrypted = Buffer.from(
    encryptedBase64,
    'base64'
  );

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}