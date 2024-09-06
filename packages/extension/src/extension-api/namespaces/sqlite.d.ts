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
    abstract close(): Promise<void>;
    abstract execute(sql: string): void;
    abstract sql<T = unknown>(sql: string): Statement<T>;
  }

  interface OpenOptions {
    path: string;
  }

  interface Static {
    // @ext-api-value
    exec(sql: string): Promise<void>;

    // @ext-api-value
    open(options: OpenOptions): Database;

    // @ext-api-value
    sql<T = unknown>(sql: string): Statement<T>;
  }
}
