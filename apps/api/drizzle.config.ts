import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/platform/db/schema.ts',
  dialect: 'sqlite',
});
