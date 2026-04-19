import type { HttpClient } from '../core/http-client.js';
import type {
  KlixPage,
  OperationQuery,
  OperationRequestBody,
  OperationResponse,
  PageItem,
} from '../core/openapi.js';
import { iterateAllPages } from '../core/pagination.js';

type ClientsPage = OperationResponse<'clients_list'>;
type ClientRecord = PageItem<ClientsPage>;
type ClientRecurringTokensPage = OperationResponse<'client_recurring_tokens_list'>;
type ClientRecurringTokenRecord = PageItem<ClientRecurringTokensPage>;

export class ClientsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(body: OperationRequestBody<'clients_create'>): Promise<OperationResponse<'clients_create'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/clients/',
      body,
    });
  }

  list(query?: OperationQuery<'clients_list'>): Promise<ClientsPage> {
    return this.httpClient.request({
      method: 'GET',
      path: '/clients/',
      query,
    });
  }

  read(id: string): Promise<OperationResponse<'clients_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/clients/${id}/`,
    });
  }

  update(
    id: string,
    body: OperationRequestBody<'clients_update'>,
  ): Promise<OperationResponse<'clients_update'>> {
    return this.httpClient.request({
      method: 'PUT',
      path: `/clients/${id}/`,
      body,
    });
  }

  patch(
    id: string,
    body: OperationRequestBody<'clients_partial_update'>,
  ): Promise<OperationResponse<'clients_partial_update'>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/clients/${id}/`,
      body,
    });
  }

  delete(id: string): Promise<OperationResponse<'clients_delete'>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/clients/${id}/`,
    });
  }

  listRecurringTokens(
    id: string,
    query?: OperationQuery<'client_recurring_tokens_list'>,
  ): Promise<ClientRecurringTokensPage> {
    return this.httpClient.request({
      method: 'GET',
      path: `/clients/${id}/recurring_tokens/`,
      query,
    });
  }

  readRecurringToken(
    clientId: string,
    recurringTokenId: string,
  ): Promise<OperationResponse<'client_recurring_tokens_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/clients/${clientId}/recurring_tokens/${recurringTokenId}/`,
    });
  }

  deleteRecurringToken(
    clientId: string,
    recurringTokenId: string,
  ): Promise<OperationResponse<'client_recurring_tokens_delete'>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/clients/${clientId}/recurring_tokens/${recurringTokenId}/`,
    });
  }

  iterateAll(query?: OperationQuery<'clients_list'>): AsyncGenerator<ClientRecord, void, undefined> {
    return iterateAllPages<ClientRecord>((nextUrl) =>
      nextUrl ? this.listByUrl(nextUrl) : this.list(query),
    );
  }

  iterateAllRecurringTokens(
    clientId: string,
    query?: OperationQuery<'client_recurring_tokens_list'>,
  ): AsyncGenerator<ClientRecurringTokenRecord, void, undefined> {
    return iterateAllPages<ClientRecurringTokenRecord>((nextUrl) =>
      nextUrl ? this.listRecurringTokensByUrl(nextUrl) : this.listRecurringTokens(clientId, query),
    );
  }

  private listByUrl(nextUrl: string): Promise<KlixPage<ClientRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }

  private listRecurringTokensByUrl(
    nextUrl: string,
  ): Promise<KlixPage<ClientRecurringTokenRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }
}
