import { createSign, generateKeyPairSync } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  KlixApiError,
  KlixClient,
  createKlixClient,
  verifyWebhookPayload,
} from '../src/index.js';
import type { FetchRequestInput } from '../src/core/http-client.js';

describe('KlixClient core behavior', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds authorization header and brand_id when listing payment methods', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) =>
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    await client.paymentMethods.list({ currency: 'EUR' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) {
      throw new Error('Expected fetch to be called.');
    }
    const [input, init] = firstCall;
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);

    expect(url.origin).toBe('https://portal.klix.app');
    expect(url.pathname).toBe('/api/v1/payment_methods/');
    expect(url.searchParams.get('currency')).toBe('EUR');
    expect(url.searchParams.get('brand_id')).toBe('brand-id');
    expect(headers.get('authorization')).toBe('Bearer secret-key');
    expect(headers.get('accept')).toBe('application/json');
  });

  it('normalizes API errors into KlixApiError', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) =>
      new Response(
        JSON.stringify({
          code: 'purchase_capture_error',
          detail: 'Capture failed',
        }),
        {
          status: 400,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    const client = new KlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    await expect(client.balance.get()).rejects.toMatchObject({
      name: 'KlixApiError',
      status: 400,
      code: 'purchase_capture_error',
      message: 'Capture failed',
    } satisfies Partial<KlixApiError>);
  });

  it('caches payment methods for 60 seconds by default', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) =>
      new Response(JSON.stringify([{ code: 'klix' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    const first = await client.paymentMethods.list({ currency: 'EUR' });
    const second = await client.paymentMethods.list({ currency: 'EUR' });

    vi.advanceTimersByTime(61_000);

    const third = await client.paymentMethods.list({ currency: 'EUR' });

    expect(first).toEqual(second);
    expect(third).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('iterates all paginated clients through next links', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      const url = new URL(String(input));
      const body =
        url.searchParams.get('page') === '2'
          ? {
              results: [{ id: 'client-2', email: 'second@example.com' }],
              next: null,
            }
          : {
              results: [{ id: 'client-1', email: 'first@example.com' }],
              next: 'https://portal.klix.app/api/v1/clients/?page=2',
            };

      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    const ids: string[] = [];

    for await (const entry of client.clients.iterateAll()) {
      ids.push(entry.id ?? '');
    }

    expect(ids).toEqual(['client-1', 'client-2']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('verifies success callbacks using Klix public key endpoint', async () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const rawBody = Buffer.from(JSON.stringify({ id: 'purchase-1' }));
    const signature = createSign('RSA-SHA256').update(rawBody).end().sign(privateKey, 'base64');

    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/public_key/')) {
        return new Response(
          JSON.stringify(publicKey.export({ type: 'pkcs1', format: 'pem' }).toString()),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });

    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      fetch: fetchMock,
    });

    await expect(client.verifySuccessCallback(rawBody, signature)).resolves.toBe(true);
  });
});

describe('verifyWebhookPayload', () => {
  it('returns true for valid webhook signatures', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const rawBody = Buffer.from(JSON.stringify({ event: 'purchase.paid' }));
    const signature = createSign('RSA-SHA256').update(rawBody).end().sign(privateKey, 'base64');
    const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();

    expect(verifyWebhookPayload(rawBody, signature, publicKeyPem)).toBe(true);
  });

  it('returns false for invalid webhook signatures', () => {
    const { publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const rawBody = Buffer.from(JSON.stringify({ event: 'purchase.paid' }));
    const publicKeyPem = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();

    expect(verifyWebhookPayload(rawBody, 'invalid-signature', publicKeyPem)).toBe(false);
  });
});
