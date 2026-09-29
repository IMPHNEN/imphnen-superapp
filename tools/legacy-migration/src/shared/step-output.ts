import { A } from '@mobily/ts-belt';
import type { TLegacyTable } from '../legacy/legacy-table.ts';
import type {
  TAdjustmentRule,
  TRejectReason,
} from '../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TReject,
  TStepOutput,
} from '../pipeline/step-types.ts';
import type { TSqlRow } from '../target/target-rows.ts';
import type { TTargetTable } from '../target/target-table.ts';

export const EMPTY_OUTPUT: TStepOutput = {
  inserts: [],
  patches: [],
  rejects: [],
  adjustments: [],
  files: [],
};

export const outputOf = (partial: Partial<TStepOutput>): TStepOutput => ({
  ...EMPTY_OUTPUT,
  ...partial,
});

export const outputsMerge = (outputs: readonly TStepOutput[]): TStepOutput =>
  A.reduce(
    outputs,
    EMPTY_OUTPUT,
    (acc, next): TStepOutput => ({
      inserts: A.concat(acc.inserts, next.inserts),
      patches: A.concat(acc.patches, next.patches),
      rejects: A.concat(acc.rejects, next.rejects),
      adjustments: A.concat(acc.adjustments, next.adjustments),
      files: A.concat(acc.files, next.files),
    })
  );

export const rejectOf = (
  table: TLegacyTable,
  id: string,
  reason: TRejectReason,
  detail: string
): TReject => ({ table, id, reason, detail, blocking: false });

export const blockingRejectOf = (
  table: TLegacyTable,
  id: string,
  reason: TRejectReason,
  detail: string
): TReject => ({ table, id, reason, detail, blocking: true });

export const adjustmentOf = (
  table: TLegacyTable,
  id: string,
  rule: TAdjustmentRule,
  detail: string
): TAdjustment => ({ table, id, rule, detail });

export const insertedRows = (
  output: TStepOutput,
  table: TTargetTable
): readonly TSqlRow[] =>
  A.flat(
    A.map(
      A.filter(output.inserts, (entry): boolean => entry.table === table),
      (entry): readonly TSqlRow[] => entry.rows
    )
  );
