import { A } from '@mobily/ts-belt';
import type { TSqlRow } from '../target/target-rows.ts';
import { TABLE_KEY, type TTargetTable } from '../target/target-table.ts';
import type {
  TMigrationState,
  TRowPatch,
  TStepOutput,
  TTableRows,
} from './step-types.ts';

export const EMPTY_STATE: TMigrationState = { tables: new Map() };

const PATCH_TARGET_MISSING = 'patch target row not found';

const withInsert = (
  tables: ReadonlyMap<TTargetTable, readonly TSqlRow[]>,
  insert: TTableRows
): ReadonlyMap<TTargetTable, readonly TSqlRow[]> =>
  new Map([
    ...tables,
    [insert.table, A.concat(tables.get(insert.table) ?? [], insert.rows)],
  ]);

const withPatch = (
  tables: ReadonlyMap<TTargetTable, readonly TSqlRow[]>,
  patch: TRowPatch
): ReadonlyMap<TTargetTable, readonly TSqlRow[]> => {
  const rows = tables.get(patch.table) ?? [];
  const column = TABLE_KEY[patch.table];
  const found = A.some(rows, (row): boolean => row[column] === patch.key);
  if (!found) {
    throw new Error(`${PATCH_TARGET_MISSING}: ${patch.table} ${patch.key}`);
  }
  return new Map([
    ...tables,
    [
      patch.table,
      A.map(
        rows,
        (row): TSqlRow =>
          row[column] === patch.key ? { ...row, ...patch.set } : row
      ),
    ],
  ]);
};

export const stateApply = (
  state: TMigrationState,
  output: TStepOutput
): TMigrationState => ({
  tables: A.reduce(
    output.patches,
    A.reduce(output.inserts, state.tables, withInsert),
    withPatch
  ),
});
