import { A, D } from '@mobily/ts-belt';
import {
  sourceCountsOf,
  type TLegacyDataset,
} from '../legacy/legacy-dataset.ts';
import type { TLegacyTable } from '../legacy/legacy-table.ts';
import { TARGET_TABLE, type TTargetTable } from '../target/target-table.ts';
import { PIPELINE_STEPS } from './pipeline-steps.ts';
import { EMPTY_STATE, stateApply } from './state-apply.ts';
import type {
  TAdjustment,
  TFileCopy,
  TFileRef,
  TMigrationOptions,
  TMigrationState,
  TReject,
  TStep,
  TTableRows,
} from './step-types.ts';

export type TMigrationResult = {
  readonly tables: readonly TTableRows[];
  readonly rejects: readonly TReject[];
  readonly adjustments: readonly TAdjustment[];
  readonly files: readonly TFileCopy[];
  readonly sourceCounts: Record<TLegacyTable, number>;
  readonly targetCounts: Readonly<Record<TTargetTable, number>>;
};

type TAccumulator = {
  readonly state: TMigrationState;
  readonly rejects: readonly TReject[];
  readonly adjustments: readonly TAdjustment[];
  readonly files: readonly TFileCopy[];
};

const filesMerge = (files: readonly TFileCopy[]): readonly TFileCopy[] =>
  A.map(
    D.values(
      A.groupBy(files, (file): string => file.targetKey)
    ) as readonly (readonly TFileCopy[])[],
    (group): TFileCopy => ({
      ...group[0],
      refs: A.flat(A.map(group, (file): readonly TFileRef[] => file.refs)),
    })
  );

export const pipelineRun = (
  legacy: TLegacyDataset,
  options: TMigrationOptions,
  steps: readonly TStep[] = PIPELINE_STEPS
): TMigrationResult => {
  const done = A.reduce(
    steps,
    {
      state: EMPTY_STATE,
      rejects: [],
      adjustments: [],
      files: [],
    } as TAccumulator,
    (acc, step): TAccumulator => {
      const output = step.run({ legacy, state: acc.state, options });
      return {
        state: stateApply(acc.state, output),
        rejects: A.concat(acc.rejects, output.rejects),
        adjustments: A.concat(acc.adjustments, output.adjustments),
        files: A.concat(acc.files, output.files),
      };
    }
  );
  const tables = A.map(
    [...done.state.tables],
    ([table, rows]): TTableRows => ({ table, rows })
  );
  return {
    tables,
    rejects: done.rejects,
    adjustments: done.adjustments,
    files: filesMerge(done.files),
    sourceCounts: sourceCountsOf(legacy),
    targetCounts: D.fromPairs(
      A.map(
        D.values(TARGET_TABLE),
        (table): readonly [TTargetTable, number] => [
          table,
          done.state.tables.get(table)?.length ?? 0,
        ]
      )
    ) as Record<TTargetTable, number>,
  };
};
