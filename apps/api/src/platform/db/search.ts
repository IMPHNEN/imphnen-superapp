import { type AnyColumn, type SQL, sql } from 'drizzle-orm';

const LIKE_ESCAPE = '\\';
const LIKE_SPECIAL = /[\\%_]/g;

export const likeEscape = (value: string): string =>
  value.replace(LIKE_SPECIAL, (found): string => `${LIKE_ESCAPE}${found}`);

export const containsWhere = (column: AnyColumn, value: string): SQL =>
  sql`${column} LIKE ${`%${likeEscape(value)}%`} ESCAPE ${LIKE_ESCAPE}`;
