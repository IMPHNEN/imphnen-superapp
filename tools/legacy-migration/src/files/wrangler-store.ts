import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { TObjectStore } from './object-store.ts';

const PNPM = 'pnpm';
const OBJECT_ARGS = ['exec', 'wrangler', 'r2', 'object'] as const;
const PUT = 'put';
const GET = 'get';
const REMOTE_FLAG = '--remote';
const FILE_FLAG = '--file';
const PIPE_FLAG = '--pipe';
const CONTENT_TYPE_FLAG = '--content-type';
const TEMP_PREFIX = 'legacy-migration-';
const TEMP_FILE = 'object';
const MAX_BUFFER = 512 * 1024 * 1024;
const PUT_FAILED = 'wrangler r2 object put failed';

export type TWranglerStoreConfig = {
  readonly bucket: string;
  readonly apiDir: string;
};

const objectPath = (config: TWranglerStoreConfig, key: string): string =>
  `${config.bucket}/${key}`;

export const wranglerR2Store = (
  config: TWranglerStoreConfig
): TObjectStore => ({
  exists: async (): Promise<boolean> => false,
  get: async (key: string): Promise<Uint8Array | null> => {
    const result = spawnSync(
      PNPM,
      [...OBJECT_ARGS, GET, objectPath(config, key), REMOTE_FLAG, PIPE_FLAG],
      { cwd: config.apiDir, maxBuffer: MAX_BUFFER }
    );
    return result.status === 0 ? new Uint8Array(result.stdout) : null;
  },
  put: async (
    key: string,
    body: Uint8Array,
    contentType: string
  ): Promise<void> => {
    const dir = mkdtempSync(join(tmpdir(), TEMP_PREFIX));
    const file = join(dir, TEMP_FILE);
    try {
      writeFileSync(file, body);
      const result = spawnSync(
        PNPM,
        [
          ...OBJECT_ARGS,
          PUT,
          objectPath(config, key),
          FILE_FLAG,
          file,
          CONTENT_TYPE_FLAG,
          contentType,
          REMOTE_FLAG,
        ],
        { cwd: config.apiDir, encoding: 'utf8', maxBuffer: MAX_BUFFER }
      );
      if (result.status !== 0) {
        throw new Error(`${PUT_FAILED}: ${key} ${result.stderr}`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
});
