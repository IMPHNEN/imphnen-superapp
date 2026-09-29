import { describe, expect, it } from 'vitest';
import type { TLegacyDataset } from '../../legacy/legacy-dataset.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  FIXTURE_OPTIONS,
  NOW,
  T0,
  T1,
  T2,
} from '../../testing/fixture-builders.ts';
import {
  CLAIM_ID,
  GACHA_CLAIMS,
  GACHA_CREDITS,
  GACHA_ITEMS,
  GACHA_POOL,
  ITEM_ID,
} from '../../testing/fixtures/gacha-fixture.ts';
import { USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import { IAM_USERS } from '../../testing/fixtures/iam-users-fixture.ts';
import {
  adjustmentsFor,
  rejectsFor,
  rowOf,
  rowsIn,
  runSteps,
} from '../../testing/run-steps.ts';
import type { TSqlRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { IAM_STEP } from '../iam/iam-step.ts';
import { GACHA_STEP } from './gacha-step.ts';

const DATASET: Partial<TLegacyDataset> = {
  [LEGACY_TABLE.APP_USERS]: IAM_USERS,
  [LEGACY_TABLE.APP_GACHA_ITEMS]: GACHA_ITEMS,
  [LEGACY_TABLE.GACHA_ROLLS]: GACHA_POOL,
  [LEGACY_TABLE.GACHA_CREDITS]: GACHA_CREDITS,
  [LEGACY_TABLE.APP_GACHA_CLAIMS]: GACHA_CLAIMS,
};
const result = runSteps(DATASET, [IAM_STEP, GACHA_STEP]);
const item = (id: string): TSqlRow | undefined =>
  rowOf(result, TARGET_TABLE.GACHA_ITEM, id);
const rules = (id: string): readonly string[] =>
  adjustmentsFor(result, id).map((entry): string => entry.rule);

describe('gacha items and the folded pool', () => {
  it('keeps item weight and stock and records the old pool odds', (): void => {
    expect(item(ITEM_ID.TUMBLER)).toMatchObject({
      code: 'tumbler-imphnen',
      weight: 0.5,
      stock: 10,
      metadata: '{"color":"black"}',
      is_limited: 0,
    });
    expect(adjustmentsFor(result, ITEM_ID.TUMBLER)).toMatchObject([
      {
        rule: 'gacha-pool-folded',
        detail: '2 pool rows, pool weight 12, item weight 0.5, stock 10',
      },
    ]);
  });

  it('stores a JSON null metadata literal as SQL NULL', (): void => {
    expect(item(ITEM_ID.STICKER)?.metadata).toBeNull();
  });

  it('clamps negative weight and stock', (): void => {
    expect(item(ITEM_ID.BROKEN)).toMatchObject({ weight: 0, stock: 0 });
    expect(rules(ITEM_ID.BROKEN)).toEqual([
      'gacha-weight-clamped',
      'gacha-stock-clamped',
    ]);
  });

  it('creates an unwinnable placeholder for pool rows without an item', (): void => {
    expect(item(ITEM_ID.UNLINKED)).toMatchObject({
      code: `pool-${ITEM_ID.UNLINKED}`,
      category: 'pool',
      weight: 6,
      stock: 0,
      created_at: T1,
    });
  });

  it('reports ignored pool rows instead of dropping them silently', (): void => {
    expect(
      result.rejects.filter(
        (entry): boolean => entry.reason === 'pool-entry-inactive'
      )
    ).toHaveLength(2);
  });

  it('keeps soft-deleted items deleted', (): void => {
    expect(item(ITEM_ID.RETIRED)?.deleted_at).toBe(T1);
  });

  it('can retire the seeder item and zero stock of never-pooled items on request', (): void => {
    const switched = runSteps(DATASET, [IAM_STEP, GACHA_STEP], {
      ...FIXTURE_OPTIONS,
      gachaRetireTestItem: true,
      gachaZeroStockUnpooled: true,
    });
    expect(
      rowOf(switched, TARGET_TABLE.GACHA_ITEM, ITEM_ID.TEST)?.deleted_at
    ).toBe(NOW);
    expect(
      rowOf(switched, TARGET_TABLE.GACHA_ITEM, ITEM_ID.STICKER)?.stock
    ).toBe(0);
    expect(
      rowOf(switched, TARGET_TABLE.GACHA_ITEM, ITEM_ID.TUMBLER)?.stock
    ).toBe(10);
  });
});

describe('gacha credits', () => {
  it('sums duplicate live rows into one balance per user', (): void => {
    expect(rowOf(result, TARGET_TABLE.GACHA_CREDIT, USER_ID.MENTEE)).toEqual({
      user_id: USER_ID.MENTEE,
      balance: 5,
      created_at: T0,
      updated_at: T1 + 1000,
    });
    expect(rules(USER_ID.MENTEE)).toContain('credit-merged');
  });

  it('clamps a negative balance and fills missing timestamps with the migration time', (): void => {
    expect(rowOf(result, TARGET_TABLE.GACHA_CREDIT, USER_ID.CONTENT)).toEqual({
      user_id: USER_ID.CONTENT,
      balance: 0,
      created_at: NOW,
      updated_at: NOW,
    });
  });

  it('rejects deleted rows and rows of unknown users', (): void => {
    expect(
      result.rejects
        .filter((entry): boolean => entry.table === LEGACY_TABLE.GACHA_CREDITS)
        .map((entry): string => entry.reason)
    ).toEqual(['soft-deleted', 'user-missing']);
  });
});

describe('gacha claims', () => {
  it('maps a roll claim to a pending prize timed at claimed_at', (): void => {
    expect(rowOf(result, TARGET_TABLE.GACHA_CLAIM, CLAIM_ID.ROLL)).toEqual({
      id: CLAIM_ID.ROLL,
      user_id: USER_ID.MENTEE,
      item_id: ITEM_ID.TUMBLER,
      source: 'roll',
      status: 'pending',
      quantity: 1,
      fulfilled_at: null,
      fulfilled_by: null,
      created_at: T2,
      updated_at: T2,
    });
  });

  it('maps standard and direct claims to grants, including placeholder items', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.GACHA_CLAIM, CLAIM_ID.STANDARD)?.source
    ).toBe('grant');
    expect(
      rowOf(result, TARGET_TABLE.GACHA_CLAIM, CLAIM_ID.PLACEHOLDER)
    ).toMatchObject({ source: 'grant', item_id: ITEM_ID.UNLINKED });
  });

  it('rejects deleted claims and claims pointing at missing users or items', (): void => {
    expect(rejectsFor(result, CLAIM_ID.DELETED)).toMatchObject([
      { reason: 'soft-deleted' },
    ]);
    expect(rejectsFor(result, CLAIM_ID.ITEM_MISSING)).toMatchObject([
      { reason: 'item-missing' },
    ]);
    expect(rejectsFor(result, CLAIM_ID.USER_MISSING)).toMatchObject([
      { reason: 'user-missing' },
    ]);
    expect(rowsIn(result, TARGET_TABLE.GACHA_CLAIM)).toHaveLength(4);
  });

  it('reports claims whose metadata was not NULL and fixes a quantity below one', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.GACHA_CLAIM, CLAIM_ID.METADATA)?.quantity
    ).toBe(1);
    expect(rules(CLAIM_ID.METADATA)).toEqual([
      'claim-value-mapped',
      'claim-metadata-present',
    ]);
  });
});
