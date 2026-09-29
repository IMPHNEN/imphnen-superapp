import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { A } from '@mobily/ts-belt';
import { API_DIR, DEFAULT_OUT_DIR } from '../config/paths.ts';
import type { TMigrationReport } from '../load/migration-report.ts';
import { OUTPUT } from '../load/output-write.ts';
import { RESET_FILE } from '../load/sql-files.ts';
import {
  D1_MODE,
  d1ExecuteFile,
  DEFAULT_DATABASE,
  type TD1Mode,
  type TD1Target,
} from '../wrangler/d1-command.ts';

const ENCODING = 'utf8';
const SQL_EXTENSION = '.sql';
const USAGE =
  'usage: apply --mode local|remote [--out dir] [--reset] [--from 0042-...sql]';
const BLOCKED =
  'report.json is blocked; fix the blocking rejects and regenerate';

const { values } = parseArgs({
  options: {
    mode: { type: 'string' },
    out: { type: 'string' },
    database: { type: 'string', default: DEFAULT_DATABASE },
    'api-dir': { type: 'string' },
    reset: { type: 'boolean', default: false },
    from: { type: 'string' },
  },
});

const modeOf = (raw: string | undefined): TD1Mode => {
  if (raw !== D1_MODE.LOCAL && raw !== D1_MODE.REMOTE) {
    throw new Error(USAGE);
  }
  return raw;
};

const apply = (): void => {
  const outDir = resolve(values.out ?? DEFAULT_OUT_DIR);
  const report = JSON.parse(
    readFileSync(join(outDir, OUTPUT.REPORT), ENCODING)
  ) as TMigrationReport;
  if (report.blocked) {
    throw new Error(BLOCKED);
  }
  const target: TD1Target = {
    mode: modeOf(values.mode),
    database: values.database ?? DEFAULT_DATABASE,
    apiDir: resolve(values['api-dir'] ?? API_DIR),
  };
  const sqlDir = join(outDir, OUTPUT.SQL_DIR);
  const files = A.filter(
    A.sort(
      A.filter(readdirSync(sqlDir), (name): boolean =>
        name.endsWith(SQL_EXTENSION)
      ),
      (left, right): number => left.localeCompare(right)
    ),
    (name): boolean =>
      values.from === undefined || name.localeCompare(values.from) >= 0
  );
  if (values.reset) {
    process.stdout.write(`${RESET_FILE}\n`);
    d1ExecuteFile(target, join(outDir, RESET_FILE));
  }
  A.forEachWithIndex(files, (index, name): void => {
    process.stdout.write(`[${index + 1}/${files.length}] ${name}\n`);
    d1ExecuteFile(target, join(sqlDir, name));
  });
};

apply();
