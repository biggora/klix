import type { HttpClient } from '../core/http-client.js';
import type {
  KlixPage,
  OperationQuery,
  OperationRequestBody,
  OperationResponse,
  PageItem,
} from '../core/openapi.js';
import { iterateAllPages } from '../core/pagination.js';

type CompanyStatementsPage = OperationResponse<'company_statements_list'>;
type CompanyStatementRecord = PageItem<CompanyStatementsPage>;

export class CompanyStatementsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBody<'company_statements_create'>,
  ): Promise<OperationResponse<'company_statements_create'>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/company_statements/',
      body,
    });
  }

  list(query?: OperationQuery<'company_statements_list'>): Promise<CompanyStatementsPage> {
    return this.httpClient.request({
      method: 'GET',
      path: '/company_statements/',
      query,
    });
  }

  read(id: string): Promise<OperationResponse<'company_statements_read'>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/company_statements/${id}/`,
    });
  }

  cancel(id: string): Promise<OperationResponse<'company_statements_cancel'>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/company_statements/${id}/cancel/`,
    });
  }

  iterateAll(
    query?: OperationQuery<'company_statements_list'>,
  ): AsyncGenerator<CompanyStatementRecord, void, undefined> {
    return iterateAllPages<CompanyStatementRecord>((nextUrl) =>
      nextUrl ? this.listByUrl(nextUrl) : this.list(query),
    );
  }

  private listByUrl(nextUrl: string): Promise<KlixPage<CompanyStatementRecord>> {
    return this.httpClient.request({
      method: 'GET',
      absoluteUrl: nextUrl,
    });
  }
}
