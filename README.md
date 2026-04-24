# Klix

[![npm version](https://img.shields.io/npm/v/@biggora/klix.svg)](https://www.npmjs.com/package/@biggora/klix)
[![Unit Tests](https://github.com/biggora/klix/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/biggora/klix/actions/workflows/unit-tests.yml)

TypeScript SDK and NestJS adapter for [Klix API](https://developers.klix.app/api/).

Targets Node.js `20+`. Ships dual `ESM`/`CommonJS` builds and a first-class NestJS subpath export.

## Install

```bash
npm install @biggora/klix
```

NestJS apps also need peer deps:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata rxjs
```

## Features

- Full current REST surface from Klix OpenAPI schema
- Typed resources for purchases, clients, billing, webhooks, statements, balance, payment methods
- Built-in auth, timeout handling, error normalization, and pagination helpers
- `paymentMethods.list()` server-side cache enabled by default for 60 seconds
- Success callback signature verification through `/public_key/`
- Pure webhook signature verification helper
- NestJS `KlixModule.forRoot()` and `KlixModule.forRootAsync()`

## Plain Node.js

```ts
import { createKlixClient } from '@biggora/klix';

const klix = createKlixClient({
  apiKey: process.env.KLIX_API_KEY!,
  brandId: process.env.KLIX_BRAND_ID!,
});

const purchase = await klix.purchases.create({
  currency: 'EUR',
  reference: 'ORDER-1001',
  client: {
    email: 'customer@example.com',
  },
  purchase: {
    products: [
      {
        name: 'Pro subscription',
        price: 1999,
        quantity: 1,
      },
    ],
  },
  success_callback: 'https://example.com/api/klix/callback',
  success_redirect: 'https://example.com/checkout/success',
  failure_redirect: 'https://example.com/checkout/failure',
});

console.log(purchase.checkout_url);
```

## Main API Surface

```ts
klix.balance.get();
klix.paymentMethods.list({ currency: 'EUR' });
klix.payoutMethods.list({ currency: 'EUR' });

klix.purchases.create(...);
klix.purchases.read(id);
klix.purchases.cancel(id);
klix.purchases.capture(id, { amount: 500 });
klix.purchases.charge(id, { recurring_token: token });
klix.purchases.refund(id, { client_name: 'Jane Doe', amount: 500 });
klix.purchases.release(id);

klix.clients.create(...);
klix.clients.list();
klix.clients.iterateAll();
klix.clients.listRecurringTokens(clientId);

klix.billing.sendInvoice(...);
klix.billingTemplates.create(...);
klix.billingTemplates.list();
klix.billingTemplates.addSubscriber(templateId, ...);
klix.billingTemplates.sendInvoice(templateId, ...);
klix.billingTemplates.listClients(templateId);

klix.companyStatements.create(...);
klix.companyStatements.list();

klix.webhooks.create(...);
klix.webhooks.list();
klix.webhooks.listDeliveries({ id: purchaseId, source_type: 'purchase' });
```

## Error Handling

SDK throws `KlixApiError`.

```ts
import { KlixApiError } from '@biggora/klix';

try {
  await klix.balance.get();
} catch (error) {
  if (error instanceof KlixApiError) {
    console.error(error.status, error.code, error.message, error.details);
  }
}
```

## Callback and Webhook Verification

### Success callback verification

`KlixClient` can fetch Klix callback public key and verify callback payload signatures.

```ts
const valid = await klix.verifySuccessCallback(rawBodyBuffer, signatureHeader);
```

### Webhook verification

For webhook deliveries, Klix provides dedicated public key per webhook.

```ts
import { verifyWebhookPayload } from '@biggora/klix';

const valid = verifyWebhookPayload(rawBodyBuffer, signatureHeader, webhook.public_key);
```

## NestJS

Use `@biggora/klix/nestjs` subpath export.

```ts
import { Module } from '@nestjs/common';
import { KlixModule } from '@biggora/klix/nestjs';

@Module({
  imports: [
    KlixModule.forRoot({
      apiKey: process.env.KLIX_API_KEY!,
      brandId: process.env.KLIX_BRAND_ID!,
    }),
  ],
})
export class PaymentsModule {}
```

Async config:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KlixModule } from '@biggora/klix/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    KlixModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        apiKey: config.getOrThrow<string>('KLIX_API_KEY'),
        brandId: config.getOrThrow<string>('KLIX_BRAND_ID'),
      }),
    }),
  ],
})
export class PaymentsModule {}
```

Inject client into services:

```ts
import { Injectable } from '@nestjs/common';
import { InjectKlixClient } from '@biggora/klix/nestjs';
import type { KlixClient } from '@biggora/klix';

@Injectable()
export class PaymentsService {
  constructor(@InjectKlixClient() private readonly klix: KlixClient) {}

  async getBalance() {
    return this.klix.balance.get();
  }
}
```

Use verifier service:

```ts
import { Controller, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { KlixSignatureVerifier } from '@biggora/klix/nestjs';

@Controller('klix')
export class KlixCallbackController {
  constructor(private readonly verifier: KlixSignatureVerifier) {}

  @Post('callback')
  async callback(@Req() req: RawBodyRequest<Request>) {
    const signature = String(req.headers['x-signature'] ?? '');
    const valid = await this.verifier.verifySuccessCallback(req.rawBody ?? Buffer.alloc(0), signature);

    return { valid };
  }
}
```

Enable raw body for callback verification:

### Express

```ts
const app = await NestFactory.create(AppModule, { rawBody: true });
```

### Fastify

```ts
const app = await NestFactory.create(
  AppModule,
  new FastifyAdapter(),
  { rawBody: true },
);
```

## Notes

- `paymentMethods.list()` injects configured `brandId` automatically and caches results by query for 60 seconds.
- `payoutMethods.list()` also injects configured `brandId`.
- `purchases.create()` and billing template creation helpers inject configured `brandId` when omitted in request body.
- Source of truth for generated types is current Klix OpenAPI schema at `https://portal.klix.app/api/schema/v1/`.
