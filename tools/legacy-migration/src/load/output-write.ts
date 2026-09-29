import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { A } from '@mobily/ts-belt';
import type { TFileCopy } from '../pipeline/step-types.ts';
import type { TMigrationReport } from './migration-report.ts';
import { RESET_FILE, type TSqlFile } from './sql-files.ts';

export const OUTPUT = {
  SQL_DIR: 'sql',
  REPORT: 'report.json',
  FILES: 'files.json',
  SNAPSHOT: 'snapshot.json',
  FILES_RESULT: 'files-result.json',
  FILES_FIXUP: 'files-fixup.sql',
} as const;

const ENCODING = 'utf8';
const INDENT = 2;

export const jsonWrite = (path: string, value: unknown): void =>
  writeFileSync(path, `${JSON.stringify(value, null, INDENT)}\n`, ENCODING);

export const outputWrite = (
  outDir: string,
  sqlFiles: readonly TSqlFile[],
  resetSql: string,
  report: TMigrationReport,
  files: readonly TFileCopy[]
): void => {
  const sqlDir = join(outDir, OUTPUT.SQL_DIR);
  rmSync(sqlDir, { recursive: true, force: true });
  mkdirSync(sqlDir, { recursive: true });
  A.forEach(sqlFiles, (file): void =>
    writeFileSync(join(sqlDir, file.name), file.content, ENCODING)
  );
  writeFileSync(join(outDir, RESET_FILE), resetSql, ENCODING);
  jsonWrite(join(outDir, OUTPUT.REPORT), report);
  jsonWrite(join(outDir, OUTPUT.FILES), files);
};
