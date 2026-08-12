import type { HttpClient } from '../core/http-client.js';
import type { OperationResponse } from '../core/openapi.js';

export class BalanceResource {
  constructor(private readonly httpClient: HttpClient) {}

  get(): Promise<OperationResponse<'balance'>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/balance/',
    });
  }
}
