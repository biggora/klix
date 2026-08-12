import type { HttpClient } from '../core/http-client.js';
import type {
  KlixPage,
  OperationQuery,
  OperationRequestBody,
  OperationResponse,
  PageItem,
} from '../core/openapi.js';
import { iterateAllPages } from '../core/pagination.js';

type WebhooksPage = OperationResponse<'webhooks_list'>;
type WebhookRecord = PageItem<WebhooksPage>;
type WebhookDeliveriesPage = OperationResponse<'webhooks_deliveries_list'>;
type WebhookDeliveryRecord = PageItem<WebhookDeliveriesPage>;

export class WebhooksResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(body: OperationRequestBody<'webhooks_create'>): Promise<OperationResponse<'webhooks_create'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/webhooks/',
      body,
    });
  }

  list(query?: OperationQuery<'webhooks_list'>): Promise<WebhooksPage> {
    return this.httpClient.request({
      method: 'GET',
      path: '/webhooks/',
      query,
    });
  }

  read(id: string): Promise<OperationResponse<'webhooks_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/webhooks/${id}/`,
    });
  }

  update(
    id: string,
    body: OperationRequestBody<'webhooks_update'>,
  ): Promise<OperationResponse<'webhooks_update'>> {
    return this.httpClient.request({
      method: 'PUT',
      path: `/webhooks/${id}/`,
      body,
    });
  }

  patch(
    id: string,
    body: OperationRequestBody<'webhooks_partial_update'>,
  ): Promise<OperationResponse<'webhooks_partial_update'>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/webhooks/${id}/`,
      body,
    });
  }

  delete(id: string): Promise<OperationResponse<'webhooks_delete'>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/webhooks/${id}/`,
    });
  }

  listDeliveries(
    query: OperationQuery<'webhooks_deliveries_list'>,
  ): Promise<WebhookDeliveriesPage> {
    return this.httpClient.request({
      method: 'GET',
      path: '/webhooks/deliveries/',
      query,
    });
  }

  iterateAll(query?: OperationQuery<'webhooks_list'>): AsyncGenerator<WebhookRecord, void, undefined> {
    return iterateAllPages<WebhookRecord>((nextUrl) =>
      nextUrl ? this.listByUrl(nextUrl) : this.list(query),
    );
  }

  iterateAllDeliveries(
    query: OperationQuery<'webhooks_deliveries_list'>,
  ): AsyncGenerator<WebhookDeliveryRecord, void, undefined> {
    return iterateAllPages<WebhookDeliveryRecord>((nextUrl) =>
      nextUrl ? this.listDeliveriesByUrl(nextUrl) : this.listDeliveries(query),
    );
  }

  private listByUrl(nextUrl: string): Promise<KlixPage<WebhookRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }

  private listDeliveriesByUrl(
    nextUrl: string,
  ): Promise<KlixPage<WebhookDeliveryRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }
}
