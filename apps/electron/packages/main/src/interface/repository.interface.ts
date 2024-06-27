import { Operators, SQL } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';

export type RepositoryQuery<T extends SQLiteTable> = (
  fields: T['_']['columns'],
  operators: Operators,
) => SQL;

export type RepositoryOptions<T extends SQLiteTable> = {
  where?: RepositoryQuery<T>;
};
