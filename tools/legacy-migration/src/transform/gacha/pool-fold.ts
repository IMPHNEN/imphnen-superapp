import { A, D } from '@mobily/ts-belt';
import type {
  TLegacyGachaItem,
  TLegacyGachaPoolEntry,
} from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TMigrationOptions,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { TGachaItemRow } from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

const PLACEHOLDER = {
  CODE_PREFIX: 'pool-',
  NAME_PREFIX: 'Prize ',
  NAME_ID_LENGTH: 8,
  RARITY: 'common',
  TYPE: 'item',
  CATEGORY: 'pool',
} as const;

export const isLivePoolEntry = (entry: TLegacyGachaPoolEntry): boolean =>
  !entry.is_deleted && entry.quantity > 0;

export const pooledItemIds = (
  pool: readonly TLegacyGachaPoolEntry[]
): ReadonlySet<string> =>
  new Set(
    A.map(A.filter(pool, isLivePoolEntry), (entry): string => entry.item_id)
  );

const effectiveWeight = (entries: readonly TLegacyGachaPoolEntry[]): number =>
  A.reduce(
    entries,
    0,
    (sum, entry): number => sum + entry.weight * entry.quantity
  );

const placeholderOf = (
  itemId: string,
  entries: readonly TLegacyGachaPoolEntry[],
  options: TMigrationOptions
): TGachaItemRow => {
  const times = A.filterMap(
    entries,
    (entry): number | undefined => entry.created_at ?? undefined
  );
  const createdAt = A.isEmpty(times) ? options.now : Math.min(...times);
  return {
    id: itemId,
    code: `${PLACEHOLDER.CODE_PREFIX}${itemId}`,
    name: `${PLACEHOLDER.NAME_PREFIX}${itemId.slice(0, PLACEHOLDER.NAME_ID_LENGTH)}`,
    description: '',
    rarity: PLACEHOLDER.RARITY,
    type: PLACEHOLDER.TYPE,
    category: PLACEHOLDER.CATEGORY,
    value: 0,
    weight: Math.max(0, effectiveWeight(entries)),
    stock: 0,
    is_limited: 0,
    metadata: null,
    created_at: createdAt,
    updated_at: createdAt,
    deleted_at: null,
  };
};

const groupOutput = (
  itemId: string,
  entries: readonly TLegacyGachaPoolEntry[],
  items: ReadonlyMap<string, TLegacyGachaItem>,
  options: TMigrationOptions
): TStepOutput => {
  const item = items.get(itemId);
  const weight = effectiveWeight(entries);
  return item === undefined
    ? outputOf({
        inserts: [
          {
            table: TARGET_TABLE.GACHA_ITEM,
            rows: [placeholderOf(itemId, entries, options)],
          },
        ],
        adjustments: [
          adjustmentOf(
            LEGACY_TABLE.GACHA_ROLLS,
            itemId,
            ADJUSTMENT_RULE.GACHA_POOL_PLACEHOLDER,
            `pool weight ${weight}, stock 0`
          ),
        ],
      })
    : outputOf({
        adjustments: [
          adjustmentOf(
            LEGACY_TABLE.GACHA_ROLLS,
            itemId,
            ADJUSTMENT_RULE.GACHA_POOL_FOLDED,
            `${entries.length} pool rows, pool weight ${weight}, item weight ${item.weight}, stock ${item.stock}`
          ),
        ],
      });
};

export const poolFold = (
  pool: readonly TLegacyGachaPoolEntry[],
  items: readonly TLegacyGachaItem[],
  options: TMigrationOptions
): TStepOutput => {
  const [live, inactive] = A.partition(pool, isLivePoolEntry);
  const byItem = new Map(
    A.map(items, (item): [string, TLegacyGachaItem] => [item.id, item])
  );
  const groups = D.toPairs(
    A.groupBy(live, (entry): string => entry.item_id)
  ) as readonly (readonly [string, readonly TLegacyGachaPoolEntry[]])[];
  return outputsMerge([
    ...A.map(
      groups,
      ([itemId, entries]): TStepOutput =>
        groupOutput(itemId, entries, byItem, options)
    ),
    outputOf({
      rejects: A.map(
        inactive,
        (entry): TReject =>
          rejectOf(
            LEGACY_TABLE.GACHA_ROLLS,
            entry.id,
            REJECT_REASON.POOL_ENTRY_INACTIVE,
            `deleted ${entry.is_deleted}, quantity ${entry.quantity}`
          )
      ),
    }),
  ]);
};
