import { createHmac } from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function decodeBase32(value: string) {
  const normalized = value.replace(/=+$/, "").toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of normalized) {
    const digit = BASE32_ALPHABET.indexOf(character);

    if (digit < 0) {
      throw new Error(`Invalid base32 character: ${character}`);
    }

    buffer = (buffer << 5) | digit;
    bits += 5;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, timestamp = Date.now()) {
  const counter = Math.floor(timestamp / 1000 / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  // HMAC-SHA-1 is the RFC 6238 default and is required for Kratos compatibility.
  // ast-grep-ignore: insecure-hash-typescript, avoid-crypto-sha1-typescript
  const digest = createHmac("sha1", decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(binary % 1_000_000).padStart(6, "0");
}
