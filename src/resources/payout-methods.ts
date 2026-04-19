import type { HttpClient } from '../core/http-client.js';
import type { OperationQuery, OperationResponse } from '../core/openapi.js';

type PayoutMethodsQuery = OperationQuery<'payout_methods'>;

export class PayoutMethodsResource {
  constructor(private readonly httpClient: HttpClient) {}

  list(
    query: Omit<PayoutMethodsQuery, 'brand_id'> &
      Partial<Pick<PayoutMethodsQuery, 'brand_id'>>,
  ): Promise<OperationResponse<'payout_methods'>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/payout_methods/',
      query: {
        ...query,
        brand_id: query.brand_id ?? this.httpClient.brandId,
      } satisfies PayoutMethodsQuery,
    });
  }
}
