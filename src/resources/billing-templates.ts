import type { HttpClient } from '../core/http-client.js';
import type {
  KlixPage,
  OperationQuery,
  OperationRequestBody,
  OperationResponse,
  PageItem,
} from '../core/openapi.js';
import { iterateAllPages } from '../core/pagination.js';

type BillingTemplatesPage = OperationResponse<'billing_templates_list'>;
type BillingTemplateRecord = PageItem<BillingTemplatesPage>;
type BillingTemplateClientsPage = OperationResponse<'billing_templates_clients_list'>;
type BillingTemplateClientRecord = PageItem<BillingTemplateClientsPage>;

export class BillingTemplatesResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: Omit<OperationRequestBody<'billing_templates_create'>, 'brand_id'> &
      Partial<Pick<OperationRequestBody<'billing_templates_create'>, 'brand_id'>>,
  ): Promise<OperationResponse<'billing_templates_create'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/billing_templates/',
      body: this.httpClient.withBrandId(body),
    });
  }

  list(query?: OperationQuery<'billing_templates_list'>): Promise<BillingTemplatesPage> {
    return this.httpClient.request({
      method: 'GET',
      path: '/billing_templates/',
      query,
    });
  }

  read(id: string): Promise<OperationResponse<'billing_templates_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/billing_templates/${id}/`,
    });
  }

  update(
    id: string,
    body: OperationRequestBody<'billing_templates_update'>,
  ): Promise<OperationResponse<'billing_templates_update'>> {
    return this.httpClient.request({
      method: 'PUT',
      path: `/billing_templates/${id}/`,
      body,
    });
  }

  delete(id: string): Promise<OperationResponse<'billing_templates_delete'>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/billing_templates/${id}/`,
    });
  }

  addSubscriber(
    id: string,
    body: OperationRequestBody<'billing_templates_add_subscriber'>,
  ): Promise<OperationResponse<'billing_templates_add_subscriber'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/billing_templates/${id}/add_subscriber/`,
      body,
    });
  }

  sendInvoice(
    id: string,
    body: OperationRequestBody<'billing_templates_send_invoice'>,
  ): Promise<OperationResponse<'billing_templates_send_invoice'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/billing_templates/${id}/send_invoice/`,
      body,
    });
  }

  listClients(
    id: string,
    query?: OperationQuery<'billing_templates_clients_list'>,
  ): Promise<BillingTemplateClientsPage> {
    return this.httpClient.request({
      method: 'GET',
      path: `/billing_templates/${id}/clients/`,
      query,
    });
  }

  readClient(
    billingTemplateId: string,
    clientId: string,
  ): Promise<OperationResponse<'billing_templates_clients_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/billing_templates/${billingTemplateId}/clients/${clientId}/`,
    });
  }

  updateClient(
    billingTemplateId: string,
    clientId: string,
    body: OperationRequestBody<'billing_templates_clients_partial_update'>,
  ): Promise<OperationResponse<'billing_templates_clients_partial_update'>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/billing_templates/${billingTemplateId}/clients/${clientId}/`,
      body,
    });
  }

  patchClient(
    billingTemplateId: string,
    clientId: string,
    body: OperationRequestBody<'billing_templates_clients_partial_update'>,
  ): Promise<OperationResponse<'billing_templates_clients_partial_update'>> {
    return this.updateClient(billingTemplateId, clientId, body);
  }

  iterateAll(
    query?: OperationQuery<'billing_templates_list'>,
  ): AsyncGenerator<BillingTemplateRecord, void, undefined> {
    return iterateAllPages<BillingTemplateRecord>((nextUrl) =>
      nextUrl ? this.listByUrl(nextUrl) : this.list(query),
    );
  }

  iterateAllClients(
    billingTemplateId: string,
    query?: OperationQuery<'billing_templates_clients_list'>,
  ): AsyncGenerator<BillingTemplateClientRecord, void, undefined> {
    return iterateAllPages<BillingTemplateClientRecord>((nextUrl) =>
      nextUrl ? this.listClientsByUrl(nextUrl) : this.listClients(billingTemplateId, query),
    );
  }

  private listByUrl(nextUrl: string): Promise<KlixPage<BillingTemplateRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }

  private listClientsByUrl(
    nextUrl: string,
  ): Promise<KlixPage<BillingTemplateClientRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }
}
