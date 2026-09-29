import { describe, expect, it } from 'vitest';
import { TARGET_TABLE, type TTargetTable } from '../target/target-table.ts';
import { countQuery, countsCompare } from './verify-counts.ts';

describe('verify counts', () => {
  it('counts every table in one row without a compound SELECT', (): void => {
    expect(countQuery([TARGET_TABLE.USER, TARGET_TABLE.EVENT])).toBe(
      'SELECT (SELECT count(*) FROM "user") AS "user", (SELECT count(*) FROM "event") AS "event";'
    );
  });

  it('flags missing tables and count mismatches', (): void => {
    const expected = { user: 3, event: 1, testimonial: 0 } as Record<
      TTargetTable,
      number
    >;
    expect(countsCompare(expected, { user: 3, event: 2 })).toEqual([
      { table: 'user', expected: 3, actual: 3, ok: true },
      { table: 'event', expected: 1, actual: 2, ok: false },
      { table: 'testimonial', expected: 0, actual: null, ok: false },
    ]);
    expect(countsCompare(expected, undefined)[0]?.ok).toBe(false);
  });
});
