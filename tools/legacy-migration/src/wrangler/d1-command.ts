import { spawnSync } from 'node:child_process';
import { A } from '@mobily/ts-belt';

export const D1_MODE = {
  LOCAL: 'local',
  REMOTE: 'remote',
} as const;

export type TD1Mode = (typeof D1_MODE)[keyof typeof D1_MODE];

export const DEFAULT_DATABASE = 'DB';

const PNPM = 'pnpm';
const BASE_ARGS = ['exec', 'wrangler', 'd1', 'execute'] as const;
const FLAG_PREFIX = '--';
const FILE_FLAG = '--file';
const COMMAND_FLAG = '--command';
const JSON_FLAG = '--json';
const YES_FLAG = '--yes';
const ENCODING = 'utf8';
const MAX_BUFFER = 256 * 1024 * 1024;
const FAILED = 'wrangler d1 execute failed';

export type TD1Target = {
  readonly mode: TD1Mode;
  readonly database: string;
  readonly apiDir: string;
};

const wrangler = (
  target: TD1Target,
  extra: readonly string[],
  inherit: boolean
): string => {
  const result = spawnSync(
    PNPM,
    A.concat(
      A.concat(BASE_ARGS, [
        target.database,
        `${FLAG_PREFIX}${target.mode}`,
        YES_FLAG,
      ]),
      extra
    ),
    {
      cwd: target.apiDir,
      encoding: ENCODING,
      maxBuffer: MAX_BUFFER,
      stdio: inherit
        ? ['ignore', 'inherit', 'inherit']
        : ['ignore', 'pipe', 'pipe'],
    }
  );
  if (result.status !== 0) {
    throw new Error(
      `${FAILED} (${A.join(extra, ' ')}): ${result.stderr ?? ''}${result.stdout ?? ''}`
    );
  }
  return result.stdout ?? '';
};

export const d1ExecuteFile = (target: TD1Target, file: string): void => {
  wrangler(target, [FILE_FLAG, file], true);
};

export type TD1Result = {
  readonly results: readonly Record<string, unknown>[];
};

export const d1Query = (target: TD1Target, sql: string): readonly TD1Result[] =>
  JSON.parse(
    wrangler(target, [COMMAND_FLAG, sql, JSON_FLAG], false)
  ) as readonly TD1Result[];
