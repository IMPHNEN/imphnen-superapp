import { A } from '@mobily/ts-belt';
import type { TLegacyGachaItem } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TMigrationOptions,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { jsonTextOrNull } from '../../shared/json-text.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
} from '../../shared/step-output.ts';
import type { TGachaItemRow } from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

export const GACHA_TEST_ITEM_CODE = 'ITEM_TEST_1';
const SQL_TRUE = 1;
const SQL_FALSE = 0;

const itemOutput = (
  item: TLegacyGachaItem,
  pooled: ReadonlySet<string>,
  options: TMigrationOptions
): TStepOutput => {
  const retire =
    options.gachaRetireTestItem &&
    item.item_code === GACHA_TEST_ITEM_CODE &&
    item.deleted_at === null;
  const clampedStock = Math.max(0, item.stock);
  const zeroStock =
    options.gachaZeroStockUnpooled && !pooled.has(item.id) && clampedStock > 0;
  const row: TGachaItemRow = {
    id: item.id,
    code: item.item_code,
    name: item.name,
    description: item.description,
    rarity: item.rarity,
    type: item.type,
    category: item.category,
    value: item.value,
    weight: Math.max(0, item.weight),
    stock: zeroStock ? 0 : clampedStock,
    is_limited: item.is_limited ? SQL_TRUE : SQL_FALSE,
    metadata: jsonTextOrNull(item.metadata),
    created_at: item.created_at,
    updated_at: item.updated_at,
    deleted_at: retire ? options.now : item.deleted_at,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.APP_GACHA_ITEMS, item.id, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.GACHA_ITEM, rows: [row] }],
    adjustments: [
      ...(item.weight < 0
        ? [note(ADJUSTMENT_RULE.GACHA_WEIGHT_CLAMPED, `${item.weight} -> 0`)]
        : []),
      ...(item.stock < 0
        ? [note(ADJUSTMENT_RULE.GACHA_STOCK_CLAMPED, `${item.stock} -> 0`)]
        : []),
      ...(zeroStock
        ? [
            note(
              ADJUSTMENT_RULE.GACHA_STOCK_ZEROED,
              `never pooled, stock ${clampedStock} -> 0`
            ),
          ]
        : []),
      ...(retire
        ? [note(ADJUSTMENT_RULE.GACHA_TEST_ITEM_RETIRED, item.item_code)]
        : []),
    ],
  });
};

export const itemsTransform = (
  items: readonly TLegacyGachaItem[],
  pooled: ReadonlySet<string>,
  options: TMigrationOptions
): TStepOutput =>
  outputsMerge(
    A.map(items, (item): TStepOutput => itemOutput(item, pooled, options))
  );
