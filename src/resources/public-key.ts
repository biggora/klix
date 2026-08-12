import type { HttpClient } from '../core/http-client.js';
import type { OperationResponse } from '../core/openapi.js';

export class PublicKeyResource {
  constructor(private readonly httpClient: HttpClient) {}

  get(): Promise<OperationResponse<'public_key'>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/public_key/',
    });
  }
}
