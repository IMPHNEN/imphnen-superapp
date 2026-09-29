import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { sqlIdentifier, sqlLiteral } from '../load/sql-literal.ts';
import {
  FILE_REF_MODE,
  type TFileCopy,
  type TFileRef,
} from '../pipeline/step-types.ts';
import { TABLE_KEY } from '../target/target-table.ts';
import { COPY_STATUS, type TCopyResult } from './file-copy.ts';

const NEWLINE = '\n';

const currentIs = (column: string, ref: TFileRef): string =>
  ref.stored === null
    ? `${sqlIdentifier(column)} IS NULL`
    : `${sqlIdentifier(column)} = ${sqlLiteral(ref.stored)}`;

export const fixupStatement = (ref: TFileRef): string => {
  const table = sqlIdentifier(ref.table);
  const column = sqlIdentifier(ref.column);
  const where = `${sqlIdentifier(TABLE_KEY[ref.table])} = ${sqlLiteral(ref.key)}`;
  return match(ref.mode)
    .with(
      FILE_REF_MODE.VALUE,
      (): string =>
        `UPDATE ${table} SET ${column} = ${sqlLiteral(ref.fallback)} WHERE ${where} AND ${currentIs(ref.column, ref)};`
    )
    .with(
      FILE_REF_MODE.ARRAY,
      (): string =>
        `UPDATE ${table} SET ${column} = (SELECT json_group_array(value) FROM json_each(${table}.${column}) WHERE value <> ${sqlLiteral(ref.stored)}) WHERE ${where};`
    )
    .exhaustive();
};

export const fixupSqlBuild = (
  files: readonly TFileCopy[],
  results: readonly TCopyResult[]
): string => {
  const failed = new Set(
    A.filterMap(results, (item): string | undefined =>
      item.status === COPY_STATUS.FAILED ? item.targetKey : undefined
    )
  );
  const statements = A.flat(
    A.map(
      A.filter(files, (file): boolean => failed.has(file.targetKey)),
      (file): readonly string[] => A.map(file.refs, fixupStatement)
    )
  );
  return A.isEmpty(statements)
    ? ''
    : `${A.join(statements, NEWLINE)}${NEWLINE}`;
};
