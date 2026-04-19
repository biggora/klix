import { createVerify } from 'node:crypto';

function normalizeRawBody(rawBody: Buffer | string): Buffer {
  return typeof rawBody === 'string' ? Buffer.from(rawBody) : rawBody;
}

export function verifyWebhookPayload(
  rawBody: Buffer | string,
  signature: string,
  publicKey: string,
): boolean {
  try {
    return createVerify('RSA-SHA256')
      .update(normalizeRawBody(rawBody))
      .end()
      .verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}
