interface ApiErrorData {
  error: string;
  message: string;
  statusCode: number;
}

export class FetchError extends Error {
  status: number;
  data: ApiErrorData;
  statusText: string;

  constructor({
    data,
    status,
    message,
    statusText,
  }: {
    status: number;
    message: string;
    statusText: string;
    data: ApiErrorData;
  }) {
    super(message);
    this.data = data;
    this.status = status;
    this.statusText = statusText;
  }

  static isFetchError(error: unknown): error is FetchError {
    return error instanceof FetchError;
  }
}

export interface ARequestInit extends RequestInit {
  auth?: string;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'formData' | 'text';
}

export async function afetch<T = unknown>(
  url: string,
  init: ARequestInit = {},
): Promise<T> {
  const request = new Request(url, init);
  if (init.auth) request.headers.set('Authorization', init.auth);

  if (
    init &&
    init.method !== 'GET' &&
    !(init.body instanceof FormData) &&
    !init.headers?.['Content-Type']
  ) {
    request.headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(request);
  const body = await response[init.responseType ?? 'json']();

  if (!response.ok) {
    throw new FetchError({
      data: body,
      message: body?.message,
      status: response.status,
      statusText: response.statusText,
    });
  }

  return body;
}
