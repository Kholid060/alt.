/* eslint-disable @typescript-eslint/no-explicit-any */
export declare namespace Sqlite {
  interface QueryOptions {
    selectAll: boolean;
  }

  interface Static {
    query<T = any>(
      sqlQuery: string,
      params?: unknown[],
      options?: Partial<QueryOptions>,
    ): Promise<T>;
  }
}