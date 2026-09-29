import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { A, D } from '@mobily/ts-belt';
import { API_DIR, DEFAULT_OUT_DIR } from '../config/paths.ts';
import type { TMigrationReport } from '../load/migration-report.ts';
import { OUTPUT } from '../load/output-write.ts';
import type { TTargetTable } from '../target/target-table.ts';
import {
  D1_MODE,
  d1Query,
  DEFAULT_DATABASE,
  type TD1Result,
  type TD1Target,
} from '../wrangler/d1-command.ts';
import {
  countQuery,
  countsCompare,
  FOREIGN_KEY_CHECK,
} from '../wrangler/verify-counts.ts';

const ENCODING = 'utf8';
const USAGE = 'usage: verify --mode local|remote [--out dir]';
const MISMATCH = 'verification failed';
const PASSED = 'verification passed';

const { values } = parseArgs({
  options: {
    mode: { type: 'string' },
    out: { type: 'string' },
    database: { type: 'string', default: DEFAULT_DATABASE },
    'api-dir': { type: 'string' },
  },
});

const verify = (): void => {
  if (values.mode !== D1_MODE.LOCAL && values.mode !== D1_MODE.REMOTE) {
    throw new Error(USAGE);
  }
  const outDir = resolve(values.out ?? DEFAULT_OUT_DIR);
  const report = JSON.parse(
    readFileSync(join(outDir, OUTPUT.REPORT), ENCODING)
  ) as TMigrationReport;
  const target: TD1Target = {
    mode: values.mode,
    database: values.database ?? DEFAULT_DATABASE,
    apiDir: resolve(values['api-dir'] ?? API_DIR),
  };
  const tables = D.keys(report.targetCounts) as readonly TTargetTable[];
  const counted = A.flat(
    A.map(
      d1Query(target, countQuery(tables)),
      (result): TD1Result['results'] => result.results
    )
  );
  const checks = countsCompare(report.targetCounts, counted);
  const violations = A.flat(
    A.map(
      d1Query(target, FOREIGN_KEY_CHECK),
      (result): TD1Result['results'] => result.results
    )
  );
  process.stdout.write(
    `${JSON.stringify({ checks, foreignKeyViolations: violations }, null, 2)}\n`
  );
  const failed =
    A.some(checks, (check): boolean => !check.ok) || A.isNotEmpty(violations);
  process.stdout.write(`${failed ? MISMATCH : PASSED}\n`);
  process.exitCode = failed ? 1 : 0;
};

verify();
