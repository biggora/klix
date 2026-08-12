import { KlixApiError, createKlixApiError, createKlixRequestError } from './error.js';

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
type QueryRecord = Record<string, QueryValue>;
export type FetchRequestInput = string | URL | Request;

export type FetchLike = (input: FetchRequestInput, init?: RequestInit) => Promise<Response>;

export type KlixClientOptions = {
  apiKey: string;
  brandId: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetch?: FetchLike;
  paymentMethodsCacheTtlMs?: number;
  enablePaymentMethodsCache?: boolean;
};

export type RequestOptions<TBody = unknown> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string | undefined;
  absoluteUrl?: string | undefined;
  query?: QueryRecord | undefined;
  body?: TBody | undefined;
  signal?: AbortSignal | undefined;
};

export class HttpClient {
  readonly apiKey: string;
  readonly brandId: string;
  readonly baseUrl: string;
  readonly timeoutMs: number;
  readonly enablePaymentMethodsCache: boolean;
  readonly paymentMethodsCacheTtlMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: KlixClientOptions) {
    this.apiKey = options.apiKey;
    this.brandId = options.brandId;
    this.baseUrl = ensureTrailingSlash(options.baseUrl ?? 'https://portal.klix.app/api/v1/');
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.enablePaymentMethodsCache = options.enablePaymentMethodsCache ?? true;
    this.paymentMethodsCacheTtlMs = options.paymentMethodsCacheTtlMs ?? 60_000;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async request<TResponse, TBody = unknown>(options: RequestOptions<TBody>): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const combinedSignal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal;

    try {
      const init: RequestInit = {
        method: options.method,
        headers: this.buildHeaders(options.body),
        signal: combinedSignal,
      };
      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }

      const response = await this.fetchImpl(this.buildUrl(options), init);

      if (!response.ok) {
        throw await createKlixApiError(response);
      }

      if (response.status === 204) {
        return undefined as TResponse;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        return undefined as TResponse;
      }

      return await response.json() as TResponse;
    } catch (error) {
      throw error instanceof KlixApiError ? error : createKlixRequestError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  withBrandId<TBody extends object>(body: TBody): TBody & { brand_id: string } {
    return {
      brand_id: this.brandId,
      ...body,
    };
  }

  private buildUrl(options: RequestOptions<unknown>): URL {
    const url = options.absoluteUrl
      ? new URL(options.absoluteUrl)
      : new URL(stripLeadingSlash(options.path ?? ''), this.baseUrl);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          url.searchParams.append(key, String(entry));
        }
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    return url;
  }

  private buildHeaders(body: unknown): Headers {
    const headers = new Headers({
      accept: 'application/json',
      authorization: `Bearer ${this.apiKey}`,
    });

    if (body !== undefined) {
      headers.set('content-type', 'application/json');
    }

    return headers;
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function stripLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}
