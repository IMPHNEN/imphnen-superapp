import { A } from '@mobily/ts-belt';
import { datasetOf, type TLegacyDataset } from '../legacy/legacy-dataset.ts';
import {
  pipelineRun,
  type TMigrationResult,
} from '../pipeline/pipeline-run.ts';
import type {
  TAdjustment,
  TMigrationOptions,
  TReject,
  TStep,
} from '../pipeline/step-types.ts';
import type { TSqlRow } from '../target/target-rows.ts';
import { TABLE_KEY, type TTargetTable } from '../target/target-table.ts';
import { FIXTURE_OPTIONS } from './fixture-builders.ts';

export const runSteps = (
  partial: Partial<TLegacyDataset>,
  steps: readonly TStep[],
  options: TMigrationOptions = FIXTURE_OPTIONS
): TMigrationResult => pipelineRun(datasetOf(partial), options, steps);

export const rowsIn = (
  result: TMigrationResult,
  table: TTargetTable
): readonly TSqlRow[] =>
  A.find(result.tables, (entry): boolean => entry.table === table)?.rows ?? [];

export const rowOf = (
  result: TMigrationResult,
  table: TTargetTable,
  key: string
): TSqlRow | undefined =>
  A.find(
    rowsIn(result, table),
    (row): boolean => row[TABLE_KEY[table]] === key
  ) ?? undefined;

export const rejectsFor = (
  result: TMigrationResult,
  id: string
): readonly TReject[] =>
  A.filter(result.rejects, (reject): boolean => reject.id === id);

export const adjustmentsFor = (
  result: TMigrationResult,
  id: string
): readonly TAdjustment[] =>
  A.filter(result.adjustments, (adjustment): boolean => adjustment.id === id);
