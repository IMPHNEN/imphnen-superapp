import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { A, D } from '@mobily/ts-belt';
import { ENV, envOptional, envRequired } from '../config/env.ts';
import { API_DIR, DEFAULT_OUT_DIR } from '../config/paths.ts';
import { COPY_STATUS, filesCopy } from '../files/file-copy.ts';
import { fixupSqlBuild } from '../files/files-fixup.ts';
import {
  s3Store,
  type TObjectStore,
  type TS3Config,
  urlFetch,
} from '../files/object-store.ts';
import { wranglerR2Store } from '../files/wrangler-store.ts';
import { jsonWrite, OUTPUT } from '../load/output-write.ts';
import type { TFileCopy } from '../pipeline/step-types.ts';

const ENCODING = 'utf8';
const DEFAULT_CONCURRENCY = '8';
const DEFAULT_LEGACY_REGION = 'us-east-1';
const R2_REGION = 'auto';
const DEFAULT_R2_BUCKET = 'imphnen-storage';

const { values } = parseArgs({
  options: {
    out: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    concurrency: { type: 'string', default: DEFAULT_CONCURRENCY },
  },
});

const legacyConfig = (): TS3Config => ({
  endpoint: envRequired(ENV.LEGACY_S3_ENDPOINT),
  region: envOptional(ENV.LEGACY_S3_REGION) ?? DEFAULT_LEGACY_REGION,
  bucket: envRequired(ENV.LEGACY_S3_BUCKET),
  accessKeyId: envRequired(ENV.LEGACY_S3_ACCESS_KEY_ID),
  secretAccessKey: envRequired(ENV.LEGACY_S3_SECRET_ACCESS_KEY),
});

const r2Config = (): TS3Config => ({
  endpoint: envRequired(ENV.R2_ENDPOINT),
  region: R2_REGION,
  bucket: envRequired(ENV.R2_BUCKET),
  accessKeyId: envRequired(ENV.R2_ACCESS_KEY_ID),
  secretAccessKey: envRequired(ENV.R2_SECRET_ACCESS_KEY),
});

const targetStore = (): TObjectStore =>
  envOptional(ENV.R2_ACCESS_KEY_ID) === null
    ? wranglerR2Store({
        bucket: envOptional(ENV.R2_BUCKET) ?? DEFAULT_R2_BUCKET,
        apiDir: API_DIR,
      })
    : s3Store(r2Config());

const copy = async (): Promise<void> => {
  const outDir = resolve(values.out ?? DEFAULT_OUT_DIR);
  const files = JSON.parse(
    readFileSync(join(outDir, OUTPUT.FILES), ENCODING)
  ) as readonly TFileCopy[];
  const results = await filesCopy(files, {
    legacy: s3Store(legacyConfig()),
    target: targetStore(),
    fetchUrl: urlFetch,
    dryRun: values['dry-run'] ?? false,
    concurrency: Number(values.concurrency ?? DEFAULT_CONCURRENCY),
  });
  jsonWrite(join(outDir, OUTPUT.FILES_RESULT), results);
  writeFileSync(
    join(outDir, OUTPUT.FILES_FIXUP),
    fixupSqlBuild(files, results),
    ENCODING
  );
  const summary = D.map(
    A.groupBy(results, (item): string => item.status) as Record<
      string,
      readonly unknown[]
    >,
    (group): number => group.length
  );
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exitCode = A.some(
    results,
    (item): boolean => item.status === COPY_STATUS.FAILED
  )
    ? 1
    : 0;
};

await copy();
