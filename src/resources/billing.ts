import type { HttpClient } from '../core/http-client.js';
import type { OperationRequestBody, OperationResponse } from '../core/openapi.js';

export class BillingResource {
  constructor(private readonly httpClient: HttpClient) {}

  sendInvoice(
    body: Omit<OperationRequestBody<'billing_templates_one_time_invoices'>, 'brand_id'> &
      Partial<Pick<OperationRequestBody<'billing_templates_one_time_invoices'>, 'brand_id'>>,
  ): Promise<OperationResponse<'billing_templates_one_time_invoices'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/billing/',
      body: this.httpClient.withBrandId(body),
    });
  }
}
