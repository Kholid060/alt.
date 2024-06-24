const fetchErrorData = {
  401: {
    status: 401,
    statusText: 'Unauthorized',
  },
  404: {
    status: 404,
    statusText: 'Not Found',
  },
};

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

  static fromStatusCode(
    statusCode: keyof typeof fetchErrorData,
    { error, message }: { error?: string; message?: string } = {},
  ) {
    const data = fetchErrorData[statusCode] ?? fetchErrorData[404];

    return new FetchError({
      data: {
        error: error ?? '',
        statusCode: data.status,
        message: message ?? data.statusText,
      },
      status: data.status,
      message: data.statusText,
      statusText: data.statusText,
    });
  }

  static isFetchError(error: unknown): error is FetchError {
    return error instanceof FetchError;
  }
}

export interface ARequestInit extends RequestInit {
  auth?: string;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob' | 'formData' | 'text' | 'arrayBuffer';
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
