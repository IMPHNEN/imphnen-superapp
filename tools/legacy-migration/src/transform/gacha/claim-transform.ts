import {
  GACHA_CLAIM_SOURCE,
  GACHA_CLAIM_STATUS,
  type TGachaClaimSource,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import type { TLegacyGachaClaim } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type { TAdjustment, TStepOutput } from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { TGachaClaimRow } from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

const LEGACY_CLAIM = {
  TYPE_STANDARD: 'standard',
  TYPE_DIRECT: 'direct',
  STATUS_CLAIMED: 'claimed',
} as const;
const QUANTITY_MIN = 1;

type TSourceMapping = {
  readonly source: TGachaClaimSource;
  readonly known: boolean;
};

export const claimSourceOf = (claimType: string): TSourceMapping =>
  match(claimType)
    .with(
      GACHA_CLAIM_SOURCE.ROLL,
      (): TSourceMapping => ({ source: GACHA_CLAIM_SOURCE.ROLL, known: true })
    )
    .with(
      LEGACY_CLAIM.TYPE_STANDARD,
      LEGACY_CLAIM.TYPE_DIRECT,
      (): TSourceMapping => ({
        source: GACHA_CLAIM_SOURCE.GRANT,
        known: true,
      })
    )
    .otherwise(
      (): TSourceMapping => ({ source: GACHA_CLAIM_SOURCE.GRANT, known: false })
    );

const claimOutput = (claim: TLegacyGachaClaim): TStepOutput => {
  const source = claimSourceOf(claim.claim_type);
  const quantity = Math.max(QUANTITY_MIN, claim.quantity);
  const row: TGachaClaimRow = {
    id: claim.id,
    user_id: claim.user_id,
    item_id: claim.gacha_item_id,
    source: source.source,
    status: GACHA_CLAIM_STATUS.PENDING,
    quantity,
    fulfilled_at: null,
    fulfilled_by: null,
    created_at: claim.claimed_at,
    updated_at: claim.updated_at,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.APP_GACHA_CLAIMS, claim.id, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.GACHA_CLAIM, rows: [row] }],
    adjustments: [
      ...(source.known
        ? []
        : [
            note(
              ADJUSTMENT_RULE.CLAIM_VALUE_MAPPED,
              `claim_type ${claim.claim_type} -> ${source.source}`
            ),
          ]),
      ...(claim.status === LEGACY_CLAIM.STATUS_CLAIMED
        ? []
        : [
            note(
              ADJUSTMENT_RULE.CLAIM_VALUE_MAPPED,
              `status ${claim.status} -> ${GACHA_CLAIM_STATUS.PENDING}`
            ),
          ]),
      ...(quantity === claim.quantity
        ? []
        : [
            note(
              ADJUSTMENT_RULE.CLAIM_VALUE_MAPPED,
              `quantity ${claim.quantity} -> ${quantity}`
            ),
          ]),
      ...(claim.metadata === null
        ? []
        : [note(ADJUSTMENT_RULE.CLAIM_METADATA_PRESENT, claim.metadata)]),
    ],
  });
};

const rejected = (
  claim: TLegacyGachaClaim,
  reason: TStepOutput['rejects'][number]['reason'],
  detail: string
): TStepOutput =>
  outputOf({
    rejects: [
      rejectOf(LEGACY_TABLE.APP_GACHA_CLAIMS, claim.id, reason, detail),
    ],
  });

export const claimsTransform = (
  claims: readonly TLegacyGachaClaim[],
  userIds: ReadonlySet<string>,
  itemIds: ReadonlySet<string>
): TStepOutput =>
  outputsMerge(
    A.map(
      claims,
      (claim): TStepOutput =>
        match({
          deleted: claim.deleted_at !== null,
          user: userIds.has(claim.user_id),
          item: itemIds.has(claim.gacha_item_id),
        })
          .with(
            { deleted: true },
            (): TStepOutput =>
              rejected(claim, REJECT_REASON.SOFT_DELETED, 'deleted_at is set')
          )
          .with(
            { user: false },
            (): TStepOutput =>
              rejected(
                claim,
                REJECT_REASON.USER_MISSING,
                `user ${claim.user_id}`
              )
          )
          .with(
            { item: false },
            (): TStepOutput =>
              rejected(
                claim,
                REJECT_REASON.ITEM_MISSING,
                `item ${claim.gacha_item_id}`
              )
          )
          .otherwise((): TStepOutput => claimOutput(claim))
    )
  );
