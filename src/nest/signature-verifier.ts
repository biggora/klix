import { Injectable } from '@nestjs/common';

import { KlixClient } from '../client.js';
import { verifyWebhookPayload } from '../core/signature.js';
import { InjectKlixClient } from './tokens.js';

@Injectable()
export class KlixSignatureVerifier {
  constructor(@InjectKlixClient() private readonly client: KlixClient) {}

  verifySuccessCallback(rawBody: Buffer | string, signature: string): Promise<boolean> {
    return this.client.verifySuccessCallback(rawBody, signature);
  }

  verifyWebhookPayload(rawBody: Buffer | string, signature: string, publicKey: string): boolean {
    return verifyWebhookPayload(rawBody, signature, publicKey);
  }
}
