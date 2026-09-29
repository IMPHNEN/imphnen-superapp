import {
  SORT_DIRECTION,
  type TPagination,
  type TSortDirection,
} from '@app/schemas';
import { asc, desc, type SQL } from 'drizzle-orm';
import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core';
import { match } from 'ts-pattern';

export type TRowPage<TRow> = {
  items: readonly TRow[];
  total: number;
};

export const offsetFor = (pagination: TPagination): number =>
  (pagination.page - 1) * pagination.pageSize;

export const orderFor = (
  column: AnySQLiteColumn,
  direction: TSortDirection
): SQL =>
  match(direction)
    .with(SORT_DIRECTION.ASC, () => asc(column))
    .with(SORT_DIRECTION.DESC, () => desc(column))
    .exhaustive();
