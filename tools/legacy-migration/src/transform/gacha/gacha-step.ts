import { A } from '@mobily/ts-belt';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  STEP_NAME,
  type TStep,
  type TStepInput,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import { userIdsOf } from '../../shared/state.ts';
import { insertedRows, outputsMerge } from '../../shared/step-output.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { claimsTransform } from './claim-transform.ts';
import { creditsTransform } from './credit-transform.ts';
import { itemsTransform } from './item-transform.ts';
import { poolFold, pooledItemIds } from './pool-fold.ts';

const run = (input: TStepInput): TStepOutput => {
  const items = input.legacy[LEGACY_TABLE.APP_GACHA_ITEMS];
  const pool = input.legacy[LEGACY_TABLE.GACHA_ROLLS];
  const userIds = userIdsOf(input.state);
  const catalogue = outputsMerge([
    itemsTransform(items, pooledItemIds(pool), input.options),
    poolFold(pool, items, input.options),
  ]);
  const itemIds = new Set(
    A.map(insertedRows(catalogue, TARGET_TABLE.GACHA_ITEM), (row): string =>
      String(row.id)
    )
  );
  return outputsMerge([
    catalogue,
    creditsTransform(
      input.legacy[LEGACY_TABLE.GACHA_CREDITS],
      userIds,
      input.options.now
    ),
    claimsTransform(
      input.legacy[LEGACY_TABLE.APP_GACHA_CLAIMS],
      userIds,
      itemIds
    ),
  ]);
};

export const GACHA_STEP: TStep = { name: STEP_NAME.GACHA, run };
