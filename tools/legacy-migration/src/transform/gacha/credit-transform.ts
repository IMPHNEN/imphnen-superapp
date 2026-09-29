import { A, D } from '@mobily/ts-belt';
import type { TLegacyGachaCredit } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { TGachaCreditRow } from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

const timesOf = (
  rows: readonly TLegacyGachaCredit[],
  pick: (row: TLegacyGachaCredit) => number | null
): readonly number[] => A.filterMap(rows, (row) => pick(row) ?? undefined);

const earliest = (values: readonly number[]): number | null =>
  A.isEmpty(values) ? null : Math.min(...values);

const latest = (values: readonly number[]): number | null =>
  A.isEmpty(values) ? null : Math.max(...values);

const balanceOutput = (
  userId: string,
  rows: readonly TLegacyGachaCredit[],
  now: number
): TStepOutput => {
  const created = timesOf(rows, (row): number | null => row.created_at);
  const updated = timesOf(rows, (row): number | null => row.updated_at);
  const sum = A.reduce(
    rows,
    0,
    (total, row): number => total + row.available_rolls
  );
  const createdAt = earliest(created) ?? latest(updated) ?? now;
  const row: TGachaCreditRow = {
    user_id: userId,
    balance: Math.max(0, sum),
    created_at: createdAt,
    updated_at: latest(updated) ?? earliest(created) ?? now,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.GACHA_CREDITS, userId, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.GACHA_CREDIT, rows: [row] }],
    adjustments: [
      ...(rows.length > 1
        ? [
            note(
              ADJUSTMENT_RULE.CREDIT_MERGED,
              `${rows.length} live rows summed to ${sum}`
            ),
          ]
        : []),
      ...(sum < 0 ? [note(ADJUSTMENT_RULE.CREDIT_CLAMPED, `${sum} -> 0`)] : []),
    ],
  });
};

export const creditsTransform = (
  credits: readonly TLegacyGachaCredit[],
  userIds: ReadonlySet<string>,
  now: number
): TStepOutput => {
  const [live, deleted] = A.partition(
    credits,
    (row): boolean => !row.is_deleted
  );
  const [known, orphan] = A.partition(live, (row): boolean =>
    userIds.has(row.user_id)
  );
  const groups = D.toPairs(
    A.groupBy(known, (row): string => row.user_id)
  ) as readonly (readonly [string, readonly TLegacyGachaCredit[]])[];
  return outputsMerge([
    ...A.map(
      groups,
      ([userId, rows]): TStepOutput => balanceOutput(userId, rows, now)
    ),
    outputOf({
      rejects: A.concat(
        A.map(
          deleted,
          (row): TReject =>
            rejectOf(
              LEGACY_TABLE.GACHA_CREDITS,
              row.id,
              REJECT_REASON.SOFT_DELETED,
              `user ${row.user_id}`
            )
        ),
        A.map(
          orphan,
          (row): TReject =>
            rejectOf(
              LEGACY_TABLE.GACHA_CREDITS,
              row.id,
              REJECT_REASON.USER_MISSING,
              `user ${row.user_id}`
            )
        )
      ),
    }),
  ]);
};
