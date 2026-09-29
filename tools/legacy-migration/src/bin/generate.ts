import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import {
  DEFAULT_STORAGE_PUBLIC_URL,
  ENV,
  envList,
  envOptional,
  envRequired,
} from '../config/env.ts';
import { DEFAULT_OUT_DIR } from '../config/paths.ts';
import { datasetOf } from '../legacy/legacy-dataset.ts';
import { legacyExtract, type TExtraction } from '../extract/legacy-extract.ts';
import { reportBuild } from '../load/migration-report.ts';
import { jsonWrite, OUTPUT, outputWrite } from '../load/output-write.ts';
import { resetSqlBuild, sqlFilesBuild } from '../load/sql-files.ts';
import { pipelineRun } from '../pipeline/pipeline-run.ts';
import type { TMigrationOptions } from '../pipeline/step-types.ts';

const ENCODING = 'utf8';
const BLOCKED =
  'blocking rejects found (see report.json rejects with blocking: true); no SQL was written';

const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    snapshot: { type: 'string' },
    'snapshot-out': { type: 'string' },
    now: { type: 'string' },
    'gacha-zero-stock-unpooled': { type: 'boolean', default: false },
    'gacha-retire-test-item': { type: 'boolean', default: false },
  },
});

const extraction = async (): Promise<TExtraction> =>
  values.snapshot === undefined
    ? legacyExtract(envRequired(ENV.LEGACY_DATABASE_URL))
    : (JSON.parse(
        readFileSync(resolve(values.snapshot), ENCODING)
      ) as TExtraction);

const nowOf = (raw: string | undefined): number =>
  match(raw)
    .with(P.nullish, (): number => Date.now())
    .when(
      (value): boolean => Number.isNaN(Number(value)),
      (value): number => Date.parse(value)
    )
    .otherwise((value): number => Number(value));

const generate = async (): Promise<void> => {
  const outDir = resolve(values.out ?? DEFAULT_OUT_DIR);
  mkdirSync(outDir, { recursive: true });
  const extracted = await extraction();
  if (values['snapshot-out'] !== undefined) {
    jsonWrite(resolve(values['snapshot-out']), extracted);
  }
  const options: TMigrationOptions = {
    now: nowOf(values.now),
    storagePublicUrl:
      envOptional(ENV.STORAGE_PUBLIC_URL) ?? DEFAULT_STORAGE_PUBLIC_URL,
    legacyFileUrlPrefixes: envList(ENV.LEGACY_FILE_URL_PREFIXES),
    gachaZeroStockUnpooled: values['gacha-zero-stock-unpooled'] ?? false,
    gachaRetireTestItem: values['gacha-retire-test-item'] ?? false,
  };
  const result = pipelineRun(datasetOf(extracted.dataset), options);
  const blocked = A.some(result.rejects, (reject): boolean => reject.blocking);
  const sqlFiles = blocked ? [] : sqlFilesBuild(result.tables);
  const report = reportBuild(
    result,
    options,
    sqlFiles,
    extracted.missingTables
  );
  outputWrite(
    outDir,
    sqlFiles,
    resetSqlBuild(result.tables),
    report,
    result.files
  );
  process.stdout.write(
    `${JSON.stringify({ out: outDir, report: join(outDir, OUTPUT.REPORT), targetCounts: report.targetCounts, rejects: report.rejects.byReason, files: report.files.total, sqlFiles: sqlFiles.length }, null, 2)}\n`
  );
  if (blocked) {
    process.stderr.write(`${BLOCKED}\n`);
    process.exitCode = 1;
  }
};

await generate();
