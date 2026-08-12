import 'reflect-metadata';

import { createSign, generateKeyPairSync } from 'node:crypto';
import { Controller, Inject, Module, Post, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { RawBodyRequest } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { KlixClient } from '../src/index.js';
import {
  InjectKlixClient,
  KLIX_CLIENT,
  KlixModule,
  KlixSignatureVerifier,
} from '../src/nest/index.js';

class DirectInjectService {
  constructor(@Inject(KLIX_CLIENT) readonly client: KlixClient) {}
}

class DecoratorInjectService {
  constructor(@InjectKlixClient() readonly client: KlixClient) {}
}

@Controller('callbacks')
class CallbackController {
  constructor(@Inject(KlixSignatureVerifier) private readonly verifier: KlixSignatureVerifier) {}

  @Post()
  async handle(@Req() req: RawBodyRequest<Request>) {
    const signature = String(req.headers['x-signature'] ?? '');
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const valid = await this.verifier.verifySuccessCallback(payload, signature);

    return { valid };
  }
}

describe('Klix NestJS integration', () => {
  it('registers KLIX_CLIENT through forRoot', async () => {
    const fetchMock = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const moduleRef = await Test.createTestingModule({
      imports: [
        KlixModule.forRoot({
          apiKey: 'secret-key',
          brandId: 'brand-id',
          fetch: fetchMock,
        }),
      ],
      providers: [DirectInjectService, DecoratorInjectService],
    }).compile();

    const direct = moduleRef.get(DirectInjectService);
    const decorated = moduleRef.get(DecoratorInjectService);

    expect(direct.client).toBeDefined();
    expect(decorated.client).toBe(direct.client);
  });

  it('builds client through forRootAsync factory', async () => {
    const fetchMock = async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });

    const moduleRef = await Test.createTestingModule({
      imports: [
        KlixModule.forRootAsync({
          useFactory: async () => ({
            apiKey: 'secret-key',
            brandId: 'brand-id',
            fetch: fetchMock,
          }),
        }),
      ],
    }).compile();

    const client = moduleRef.get<KlixClient>(KLIX_CLIENT);
    expect(client).toBeDefined();
    expect(client.paymentMethods).toBeDefined();
  });

  it('handles callback verification inside Nest controller', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const payload = { id: 'purchase-1', event_type: 'purchase.paid' };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = createSign('RSA-SHA256').update(rawBody).end().sign(privateKey, 'base64');
    const fetchMock = async () =>
      new Response(
        JSON.stringify({
          public_key: publicKey.export({ type: 'pkcs1', format: 'pem' }).toString(),
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      );

    const moduleRef = await Test.createTestingModule({
      imports: [
        KlixModule.forRoot({
          apiKey: 'secret-key',
          brandId: 'brand-id',
          fetch: fetchMock,
        }),
      ],
      controllers: [CallbackController],
    }).compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>(
      new ExpressAdapter(),
      { rawBody: true },
    );
    await app.init();

    await request(app.getHttpServer())
      .post('/callbacks')
      .set('x-signature', signature)
      .set('content-type', 'application/json')
      .send(rawBody.toString())
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual({
          valid: expect.any(Boolean),
        });
      });

    await app.close();
  });
});
