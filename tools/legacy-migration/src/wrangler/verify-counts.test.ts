import { describe, expect, it } from 'vitest';
import { TARGET_TABLE, type TTargetTable } from '../target/target-table.ts';
import { countQuery, countsCompare } from './verify-counts.ts';

describe('verify counts', () => {
  it('counts every table in one query', (): void => {
    expect(countQuery([TARGET_TABLE.USER, TARGET_TABLE.EVENT])).toBe(
      `SELECT 'user' AS table_name, count(*) AS row_count FROM "user" UNION ALL SELECT 'event' AS table_name, count(*) AS row_count FROM "event";`
    );
  });

  it('flags missing tables and count mismatches', (): void => {
    const expected = { user: 3, event: 1, testimonial: 0 } as Record<
      TTargetTable,
      number
    >;
    const checks = countsCompare(expected, [
      { table_name: 'user', row_count: 3 },
      { table_name: 'event', row_count: 2 },
    ]);
    expect(checks).toEqual([
      { table: 'user', expected: 3, actual: 3, ok: true },
      { table: 'event', expected: 1, actual: 2, ok: false },
      { table: 'testimonial', expected: 0, actual: null, ok: false },
    ]);
  });
});
