import { A } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import type { TTableRows } from '../pipeline/step-types.ts';
import { TARGET_TABLE } from '../target/target-table.ts';
import { sqlIdentifier, sqlLiteral } from './sql-literal.ts';
import {
  DEFER_FOREIGN_KEYS,
  SQL_FILE_LIMIT,
  sqlFilesBuild,
} from './sql-files.ts';
import { insertStatements, SQL_LIMIT } from './sql-statements.ts';

const events = (count: number, description: string): TTableRows => ({
  table: TARGET_TABLE.EVENT,
  rows: A.makeWithIndex(
    count,
    (index): Record<string, string | number | null> => ({
      id: `e-${index}`,
      description,
      price: index,
      location: null,
    })
  ),
});

describe('SQL output', () => {
  it('escapes literals and identifiers', (): void => {
    expect(sqlLiteral("it's")).toBe("'it''s'");
    expect(sqlLiteral(null)).toBe('NULL');
    expect(sqlLiteral(0.5)).toBe('0.5');
    expect(sqlIdentifier('user')).toBe('"user"');
    expect((): string => sqlLiteral(Number.NaN)).toThrow();
  });

  it('packs rows into multi-row inserts under the statement limits', (): void => {
    const statements = insertStatements(events(120, 'x'));
    expect(statements).toHaveLength(3);
    expect(statements[0]).toMatch(
      /^INSERT INTO "event" \("id", "description", "price", "location"\) VALUES \('e-0', 'x', 0, NULL\), /
    );
  });

  it('starts a new statement before a statement would pass the byte limit', (): void => {
    const statements = insertStatements(events(10, 'y'.repeat(30_000)));
    expect(statements.length).toBeGreaterThan(3);
    A.forEach(statements, (statement): void => {
      expect(Buffer.byteLength(statement)).toBeLessThan(
        SQL_LIMIT.D1_STATEMENT_BYTES
      );
    });
  });

  it('refuses a single row larger than the D1 statement limit', (): void => {
    expect((): readonly string[] =>
      insertStatements(events(1, 'z'.repeat(SQL_LIMIT.D1_STATEMENT_BYTES)))
    ).toThrow();
  });

  it('refuses rows of one table with different columns', (): void => {
    expect((): readonly string[] =>
      insertStatements({
        table: TARGET_TABLE.EVENT,
        rows: [{ id: 'a' }, { id: 'b', name: 'c' }],
      })
    ).toThrow();
  });

  it('splits files by statement count, names them in order and defers foreign keys', (): void => {
    const files = sqlFilesBuild([
      events(
        SQL_LIMIT.ROWS_PER_STATEMENT * (SQL_FILE_LIMIT.STATEMENTS + 1),
        'w'
      ),
      { table: TARGET_TABLE.USER, rows: [] },
    ]);
    expect(A.map(files, (file): string => file.name)).toEqual([
      '0001-event-1.sql',
      '0002-event-2.sql',
    ]);
    expect(files[0]?.statements).toBe(SQL_FILE_LIMIT.STATEMENTS);
    A.forEach(files, (file): void => {
      expect(file.content.startsWith(`${DEFER_FOREIGN_KEYS}\n`)).toBe(true);
    });
  });
});
