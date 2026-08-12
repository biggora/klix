import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

import { afterEach, describe, expect, it } from 'vitest';

import { createKlixClient } from '../src/index.js';

describe('KlixClient HTTP integration', () => {
  const servers = new Set<ReturnType<typeof createServer>>();

  afterEach(async () => {
    await Promise.all(
      [...servers].map(
        (server) =>
          new Promise<void>((resolve, reject) => {
            server.close((error) => {
              if (error) {
                reject(error);
                return;
              }

              resolve();
            });
          }),
      ),
    );
    servers.clear();
  });

  it('sends purchase creation requests to a real HTTP server with auth and brand_id', async () => {
    let authorizationHeader = '';
    let receivedBody = '';

    const server = createServer((req, res) => {
      authorizationHeader = req.headers.authorization ?? '';

      req.setEncoding('utf8');
      req.on('data', (chunk) => {
        receivedBody += chunk;
      });
      req.on('end', () => {
        res.statusCode = 201;
        res.setHeader('content-type', 'application/json');
        res.end(
          JSON.stringify({
            id: 'purchase-1',
            checkout_url: 'https://checkout.example/purchase-1',
          }),
        );
      });
    });
    servers.add(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const port = (server.address() as AddressInfo).port;
    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      baseUrl: `http://127.0.0.1:${port}/api/v1/`,
    });

    const response = await client.purchases.create({
      currency: 'EUR',
      client: { email: 'customer@example.com' },
      purchase: {
        products: [{ name: 'Subscription', price: 500, quantity: 1 }],
      },
    } as any);

    const parsedBody = JSON.parse(receivedBody);

    expect(authorizationHeader).toBe('Bearer secret-key');
    expect(parsedBody.brand_id).toBe('brand-id');
    expect(parsedBody.purchase.products[0].name).toBe('Subscription');
    expect(response.id).toBe('purchase-1');
  });

  it('follows paginated next links against a real HTTP server', async () => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const body =
        url.searchParams.get('page') === '2'
          ? { results: [{ id: 'client-2' }], next: null }
          : {
              results: [{ id: 'client-1' }],
              next: `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1/clients/?page=2`,
            };

      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(body));
    });
    servers.add(server);
    await new Promise<void>((resolve) => server.listen(0, resolve));

    const port = (server.address() as AddressInfo).port;
    const client = createKlixClient({
      apiKey: 'secret-key',
      brandId: 'brand-id',
      baseUrl: `http://127.0.0.1:${port}/api/v1/`,
    });

    const ids: string[] = [];
    for await (const entry of client.clients.iterateAll()) {
      ids.push(entry.id ?? '');
    }

    expect(ids).toEqual(['client-1', 'client-2']);
  });
});
