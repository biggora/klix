import type { HttpClient } from '../core/http-client.js';
import type { OperationRequestBody, OperationResponse } from '../core/openapi.js';

export class PurchasesResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: Omit<OperationRequestBody<'purchases_create'>, 'brand_id'> &
      Partial<Pick<OperationRequestBody<'purchases_create'>, 'brand_id'>>,
  ): Promise<OperationResponse<'purchases_create'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/purchases/',
      body: this.httpClient.withBrandId(body),
    });
  }

  read(id: string): Promise<OperationResponse<'purchases_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/purchases/${id}/`,
    });
  }

  cancel(id: string): Promise<OperationResponse<'purchases_cancel'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/cancel/`,
    });
  }

  capture(
    id: string,
    body?: OperationRequestBody<'purchases_capture'>,
  ): Promise<OperationResponse<'purchases_capture'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/capture/`,
      body,
    });
  }

  charge(
    id: string,
    body: OperationRequestBody<'purchases_charge'>,
  ): Promise<OperationResponse<'purchases_charge'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/charge/`,
      body,
    });
  }

  deleteRecurringToken(
    id: string,
  ): Promise<OperationResponse<'purchases_delete_recurring_token'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/delete_recurring_token/`,
    });
  }

  markAsPaid(id: string): Promise<OperationResponse<'purchases_mark_as_paid'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/mark_as_paid/`,
    });
  }

  refund(
    id: string,
    body?: OperationRequestBody<'purchases_refund'>,
  ): Promise<OperationResponse<'purchases_refund'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/refund/`,
      body,
    });
  }

  release(id: string): Promise<OperationResponse<'purchases_release'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/release/`,
    });
  }

  resendInvoice(id: string): Promise<OperationResponse<'purchases_resend_invoice'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/purchases/${id}/resend_invoice/`,
    });
  }
}
