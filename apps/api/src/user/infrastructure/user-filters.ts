import { USER_SORT, type TUserSort } from '@app/schemas';
import { eq, or, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { match, P } from 'ts-pattern';
import { containsWhere } from '#/platform/db/search.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const SORT_COLUMN: Record<TUserSort, AnySQLiteColumn> = {
  [USER_SORT.NAME]: user.name,
  [USER_SORT.EMAIL]: user.email,
  [USER_SORT.ROLE]: user.role,
  [USER_SORT.CREATED_AT]: user.createdAt,
};

export const searchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.nonNullable, (value) =>
      or(containsWhere(user.name, value), containsWhere(user.email, value))
    )
    .otherwise(() => undefined);

export const roleWhere = (role: string | undefined): SQL | undefined =>
  match(role)
    .with(P.nonNullable, (value) => eq(user.role, value))
    .otherwise(() => undefined);

export const activeWhere = (isActive: boolean | undefined): SQL | undefined =>
  match(isActive)
    .with(P.boolean, (value) => eq(user.isActive, value))
    .otherwise(() => undefined);
