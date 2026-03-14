import { randomBytes } from 'crypto';

const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomBase62(length: number): string {
  const bytes = randomBytes(length);
  let output = '';

  for (let i = 0; i < length; i++) {
    output += BASE62_ALPHABET[bytes[i] % BASE62_ALPHABET.length];
  }

  return output;
}

export function generateShortId(prefix: string, length: number = 10): string {
  return `${prefix}_${randomBase62(length)}`;
}

export function generateInviteCode(length: number = 8): string {
  return randomBase62(length);
}
