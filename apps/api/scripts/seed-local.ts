import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { SEED_DEFAULT_PASSWORD, SEED_ENV, SEED_USERS } from './seed-data.ts';
import { seedSqlBuild } from './seed-sql.ts';

const OUTPUT = new URL('../.wrangler/seed/seed-local.sql', import.meta.url)
  .pathname;
const OUTPUT_ENCODING = 'utf8';

const seedWrite = async (): Promise<void> => {
  const password = process.env[SEED_ENV.PASSWORD] ?? SEED_DEFAULT_PASSWORD;
  const hash = await hashPassword(password);
  mkdirSync(dirname(OUTPUT), { recursive: true });
  writeFileSync(
    OUTPUT,
    seedSqlBuild(SEED_USERS, hash, Date.now()),
    OUTPUT_ENCODING
  );
  process.stdout.write(`${OUTPUT}\n`);
};

await seedWrite();
