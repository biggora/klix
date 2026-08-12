import type { HttpClient } from '../core/http-client.js';
import type { OperationQuery, OperationResponse } from '../core/openapi.js';

type PaymentMethodsQuery = OperationQuery<'payment_methods'>;

type CacheEntry = {
  expiresAt: number;
  value: OperationResponse<'payment_methods'>;
};

export class PaymentMethodsResource {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly httpClient: HttpClient) {}

  async list(
    query: Omit<PaymentMethodsQuery, 'brand_id'> &
      Partial<Pick<PaymentMethodsQuery, 'brand_id'>>,
  ): Promise<OperationResponse<'payment_methods'>> {
    const finalQuery = {
      ...query,
      brand_id: query.brand_id ?? this.httpClient.brandId,
    } satisfies PaymentMethodsQuery;

    const cacheKey = JSON.stringify(finalQuery);
    const cached = this.cache.get(cacheKey);
    if (
      this.httpClient.enablePaymentMethodsCache &&
      cached &&
      cached.expiresAt > Date.now()
    ) {
      return cached.value;
    }

    const value = await this.httpClient.request<OperationResponse<'payment_methods'>>({
      method: 'GET',
      path: '/payment_methods/',
      query: finalQuery,
    });

    if (this.httpClient.enablePaymentMethodsCache) {
      this.cache.set(cacheKey, {
        expiresAt: Date.now() + this.httpClient.paymentMethodsCacheTtlMs,
        value,
      });
    }

    return value;
  }
}
