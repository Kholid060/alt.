/* eslint-disable @typescript-eslint/no-explicit-any */
export declare namespace Sqlite {
  interface DBRunResult {
    changes: number;
    lastInsertRowid: number;
  }
  interface Statement<P = unknown> {
    run(...params: unknown[]): Promise<DBRunResult>;
    get<T = P>(...params: unknown[]): Promise<T>;
    all<T = P>(...params: unknown[]): Promise<T[]>;
  }

  abstract class Database {
    abstract sql<T = unknown>(sql: string): Statement<T>;
  }

  interface Static {
    // @ext-api-value
    sql<T = unknown>(sql: string): Statement<T>;
  }
}
