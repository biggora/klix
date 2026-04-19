import { afterEach, describe, expect, it, vi } from 'vitest';

import { createKlixClient } from '../src/index.js';
import type { FetchRequestInput } from '../src/core/http-client.js';

describe('Klix resource routing', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('routes purchases actions to documented endpoints', async () => {
    const calls: Array<{ url: URL; method: string }> = [];
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
      calls.push({
        url: new URL(String(input)),
        method: init?.method ?? 'GET',
      });

      return new Response(JSON.stringify({ id: 'purchase-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    await client.purchases.read('purchase-1');
    await client.purchases.capture('purchase-1', { amount: 5 });
    await client.purchases.release('purchase-1');
    await client.purchases.refund('purchase-1', { client_name: 'Test Client', amount: 4 });
    await client.purchases.charge('purchase-1', { recurring_token: 'token-1' });

    expect(
      calls.map(({ url, method }) => `${method} ${url.pathname}`),
    ).toEqual([
      'GET /api/v1/purchases/purchase-1/',
      'POST /api/v1/purchases/purchase-1/capture/',
      'POST /api/v1/purchases/purchase-1/release/',
      'POST /api/v1/purchases/purchase-1/refund/',
      'POST /api/v1/purchases/purchase-1/charge/',
    ]);
  });

  it('routes billing, webhooks, and statements endpoints to documented paths', async () => {
    const calls: Array<{ url: URL; method: string }> = [];
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
      calls.push({
        url: new URL(String(input)),
        method: init?.method ?? 'GET',
      });

      return new Response(JSON.stringify({ results: [], next: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    await client.billing.sendInvoice({ clients: [] } as any);
    await client.webhooks.list();
    await client.webhooks.listDeliveries({ id: 'purchase-1', source_type: 'purchase' });
    await client.companyStatements.list();

    expect(
      calls.map(({ url, method }) => `${method} ${url.pathname}`),
    ).toEqual([
      'POST /api/v1/billing/',
      'GET /api/v1/webhooks/',
      'GET /api/v1/webhooks/deliveries/',
      'GET /api/v1/company_statements/',
    ]);
    expect(calls[2]?.url.searchParams.get('id')).toBe('purchase-1');
  });
});
