import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './packages/main/src/db/schema/*.schema.ts',
  out: './packages/main/src/db/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: '',
  },
});
