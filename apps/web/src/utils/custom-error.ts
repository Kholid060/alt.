interface PageErrorData {
  404: { path?: string; btnText?: string; message?: string };
}
export class PageError<T extends keyof PageErrorData> extends Error {
  status: T;
  $type: 'PageError';
  data: PageErrorData[T];

  constructor(status: T, data: PageErrorData[T]) {
    super(data.message);

    this.data = data;
    this.status = status;
    this.$type = 'PageError';
  }

  static isPageError<T extends keyof PageErrorData>(
    error: unknown,
    status?: T,
  ): error is PageError<T> {
    console.dir(error);
    console.log(
      error instanceof Error && '$type' in error && error.$type === 'PageError',
    );
    if (
      error instanceof Error &&
      '$type' in error &&
      error.$type === 'PageError'
    )
      return true;

    if (!(error instanceof PageError)) return false;

    return typeof status === 'undefined' ? true : error.status === status;
  }
}
