import { A } from '@mobily/ts-belt';
import type { TMigrationState } from '../pipeline/step-types.ts';
import type { TSqlRow, TUserRow } from '../target/target-rows.ts';
import { TARGET_TABLE, type TTargetTable } from '../target/target-table.ts';

export const rowsOf = (
  state: TMigrationState,
  table: TTargetTable
): readonly TSqlRow[] => state.tables.get(table) ?? [];

export const usersOf = (state: TMigrationState): readonly TUserRow[] =>
  rowsOf(state, TARGET_TABLE.USER) as readonly TUserRow[];

export const userIdsOf = (state: TMigrationState): ReadonlySet<string> =>
  new Set(A.map(usersOf(state), (row): string => row.id));

export const usersById = (
  state: TMigrationState
): ReadonlyMap<string, TUserRow> =>
  new Map(A.map(usersOf(state), (row): [string, TUserRow] => [row.id, row]));
