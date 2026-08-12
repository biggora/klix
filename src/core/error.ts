export type KlixApiErrorOptions = {
  status?: number | undefined;
  code?: string | undefined;
  details?: unknown;
  raw?: unknown;
  requestId?: string | null | undefined;
  cause?: unknown;
};

export class KlixApiError extends Error {
  status: number | undefined;
  code: string | undefined;
  details: unknown;
  raw: unknown;
  requestId: string | null | undefined;

  constructor(message: string, options: KlixApiErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'KlixApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
    this.raw = options.raw;
    this.requestId = options.requestId;
  }
}

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

function pickString(record: ErrorRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export async function createKlixApiError(response: Response): Promise<KlixApiError> {
  const requestId = response.headers.get('x-request-id') ?? response.headers.get('request-id');
  const contentType = response.headers.get('content-type') ?? '';
  let raw: unknown;

  if (contentType.includes('application/json')) {
    raw = await response.json();
  } else {
    const text = await response.text();
    raw = text.length > 0 ? text : undefined;
  }

  const record = isRecord(raw) ? raw : undefined;
  const message =
    record ? pickString(record, ['detail', 'message', 'error_description', 'error']) : undefined;
  const code = record ? pickString(record, ['code', 'error_code']) : undefined;
  const details = record?.errors ?? record?.details ?? raw;

  return new KlixApiError(message ?? response.statusText ?? 'Klix API request failed.', {
    status: response.status,
    code,
    details,
    raw,
    requestId,
  });
}

export function createKlixRequestError(error: unknown): KlixApiError {
  if (error instanceof KlixApiError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new KlixApiError('Klix API request timed out.', {
      code: 'request_timeout',
      cause: error,
    });
  }

  return new KlixApiError(
    error instanceof Error ? error.message : 'Klix API request failed.',
    {
      code: 'network_error',
      cause: error,
    },
  );
}
