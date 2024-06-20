interface PageErrorData {
  404: { path?: string; btnText?: string; message?: string };
}
export class PageError<T extends keyof PageErrorData> extends Error {
  status: T;
  data: PageErrorData[T];

  constructor(status: T, data: PageErrorData[T]) {
    super(data.message);

    this.data = data;
    this.status = status;
  }

  static isPageError<T extends keyof PageErrorData>(
    error: unknown,
    status?: T,
  ): error is PageError<T> {
    if (!(error instanceof PageError)) return false;

    return typeof status === 'undefined' ? true : error.status === status;
  }
}
