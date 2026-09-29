import { A, D } from '@mobily/ts-belt';
import type { TLegacyTable } from '../legacy/legacy-table.ts';
import type { TMigrationResult } from '../pipeline/pipeline-run.ts';
import type {
  TAdjustment,
  TMigrationOptions,
  TReject,
} from '../pipeline/step-types.ts';
import type { TTargetTable } from '../target/target-table.ts';
import type { TSqlFile } from './sql-files.ts';

export type TMigrationReport = {
  readonly generatedAt: string;
  readonly blocked: boolean;
  readonly options: Omit<TMigrationOptions, 'now'>;
  readonly missingTables: readonly TLegacyTable[];
  readonly sourceCounts: Record<TLegacyTable, number>;
  readonly targetCounts: Readonly<Record<TTargetTable, number>>;
  readonly rejects: {
    readonly total: number;
    readonly blocking: number;
    readonly byReason: Record<string, number>;
    readonly items: readonly TReject[];
  };
  readonly adjustments: {
    readonly total: number;
    readonly byRule: Record<string, number>;
    readonly items: readonly TAdjustment[];
  };
  readonly files: {
    readonly total: number;
    readonly bySource: Record<string, number>;
  };
  readonly sqlFiles: readonly Omit<TSqlFile, 'content'>[];
};

const countBy = <TItem>(
  items: readonly TItem[],
  keyOf: (item: TItem) => string
): Record<string, number> =>
  D.map(
    A.groupBy(items, keyOf) as Record<string, readonly TItem[]>,
    (group): number => group.length
  );

export const reportBuild = (
  result: TMigrationResult,
  options: TMigrationOptions,
  sqlFiles: readonly TSqlFile[],
  missingTables: readonly TLegacyTable[]
): TMigrationReport => {
  const blocking = A.filter(
    result.rejects,
    (reject): boolean => reject.blocking
  );
  const { now, ...rest } = options;
  return {
    generatedAt: new Date(now).toISOString(),
    blocked: A.isNotEmpty(blocking),
    options: rest,
    missingTables,
    sourceCounts: result.sourceCounts,
    targetCounts: result.targetCounts,
    rejects: {
      total: result.rejects.length,
      blocking: blocking.length,
      byReason: countBy(result.rejects, (reject): string => reject.reason),
      items: result.rejects,
    },
    adjustments: {
      total: result.adjustments.length,
      byRule: countBy(
        result.adjustments,
        (adjustment): string => adjustment.rule
      ),
      items: result.adjustments,
    },
    files: {
      total: result.files.length,
      bySource: countBy(result.files, (file): string => file.source.kind),
    },
    sqlFiles: A.map(
      sqlFiles,
      (file): Omit<TSqlFile, 'content'> => ({
        name: file.name,
        table: file.table,
        statements: file.statements,
      })
    ),
  };
};
