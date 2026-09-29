import { A } from '@mobily/ts-belt';
import type { TSeedUser } from './seed-data.ts';

const QUOTE = "'";
const ESCAPED_QUOTE = "''";
const STATEMENT_SEPARATOR = '\n';
const CREDENTIAL_PROVIDER = 'credential';
const ACCOUNT_ID_PREFIX = 'seed-account-';
const SQL_TRUE = 1;

export const sqlText = (value: string): string =>
  `${QUOTE}${value.replaceAll(QUOTE, ESCAPED_QUOTE)}${QUOTE}`;

const userInsert = (seed: TSeedUser, now: number): string =>
  `INSERT INTO "user" (id, name, email, email_verified, image, role, is_active, deleted_at, created_at, updated_at) VALUES (${sqlText(seed.id)}, ${sqlText(seed.name)}, ${sqlText(seed.email)}, ${SQL_TRUE}, NULL, ${sqlText(seed.role)}, ${SQL_TRUE}, NULL, ${now}, ${now}) ON CONFLICT(id) DO UPDATE SET name = excluded.name, email = excluded.email, email_verified = excluded.email_verified, role = excluded.role, is_active = excluded.is_active, deleted_at = NULL, updated_at = excluded.updated_at;`;

const accountInsert = (seed: TSeedUser, hash: string, now: number): string =>
  `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES (${sqlText(`${ACCOUNT_ID_PREFIX}${seed.id}`)}, ${sqlText(seed.id)}, ${sqlText(CREDENTIAL_PROVIDER)}, ${sqlText(seed.id)}, ${sqlText(hash)}, ${now}, ${now}) ON CONFLICT(id) DO UPDATE SET password = excluded.password, updated_at = excluded.updated_at;`;

const profileInsert = (seed: TSeedUser, now: number): string =>
  `INSERT INTO user_profile (user_id, created_at, updated_at) VALUES (${sqlText(seed.id)}, ${now}, ${now}) ON CONFLICT(user_id) DO NOTHING;`;

export const seedSqlBuild = (
  users: readonly TSeedUser[],
  hash: string,
  now: number
): string =>
  A.join(
    A.flat(
      A.map(users, (seed): readonly string[] => [
        userInsert(seed, now),
        accountInsert(seed, hash, now),
        profileInsert(seed, now),
      ])
    ),
    STATEMENT_SEPARATOR
  );
