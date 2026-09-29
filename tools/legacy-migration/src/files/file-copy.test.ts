import { describe, expect, it } from 'vitest';
import {
  FILE_REF_MODE,
  FILE_SOURCE_KIND,
  type TFileCopy,
} from '../pipeline/step-types.ts';
import { TARGET_TABLE } from '../target/target-table.ts';
import { COPY_STATUS, filesCopy, type TCopyDeps } from './file-copy.ts';
import { fixupStatement } from './files-fixup.ts';
import type { TObjectStore } from './object-store.ts';

type TMemoryStore = TObjectStore & {
  readonly objects: Map<string, Uint8Array>;
};

const memoryStore = (seed: Record<string, string>): TMemoryStore => {
  const objects = new Map(
    Object.entries(seed).map(([key, value]): [string, Uint8Array] => [
      key,
      new TextEncoder().encode(value),
    ])
  );
  return {
    objects,
    exists: async (key: string): Promise<boolean> => objects.has(key),
    get: async (key: string): Promise<Uint8Array | null> =>
      objects.get(key) ?? null,
    put: async (key: string, body: Uint8Array): Promise<void> => {
      objects.set(key, body);
    },
  };
};

const copyOf = (targetKey: string, source: TFileCopy['source']): TFileCopy => ({
  targetKey,
  contentType: 'image/png',
  source,
  refs: [],
});

const FILES: readonly TFileCopy[] = [
  copyOf('profile/avatar/a.png', {
    kind: FILE_SOURCE_KIND.S3,
    key: 'profiles/a.png',
  }),
  copyOf('profile/avatar/done.png', {
    kind: FILE_SOURCE_KIND.S3,
    key: 'profiles/done.png',
  }),
  copyOf('profile/avatar/lost.png', {
    kind: FILE_SOURCE_KIND.S3,
    key: 'profiles/lost.png',
  }),
  copyOf('qr/campaign/q.png', {
    kind: FILE_SOURCE_KIND.INLINE,
    base64: Buffer.from('png').toString('base64'),
  }),
  copyOf('hackathon/team/u.webp', {
    kind: FILE_SOURCE_KIND.URL,
    url: 'https://i.imgur.com/u.webp',
  }),
];

const depsOf = (target: TMemoryStore, dryRun: boolean): TCopyDeps => ({
  legacy: memoryStore({ 'profiles/a.png': 'avatar' }),
  target,
  fetchUrl: async (url: string): Promise<Uint8Array | null> =>
    url.endsWith('.webp') ? new TextEncoder().encode('webp') : null,
  dryRun,
  concurrency: 2,
});

describe('file copy', () => {
  it('copies missing objects, skips existing ones and reports missing sources', async (): Promise<void> => {
    const target = memoryStore({ 'profile/avatar/done.png': 'old' });
    const results = await filesCopy(FILES, depsOf(target, false));
    expect(results.map((item): string => item.status)).toEqual([
      COPY_STATUS.COPIED,
      COPY_STATUS.SKIPPED,
      COPY_STATUS.FAILED,
      COPY_STATUS.COPIED,
      COPY_STATUS.COPIED,
    ]);
    expect(
      new TextDecoder().decode(target.objects.get('qr/campaign/q.png'))
    ).toBe('png');
    expect(
      new TextDecoder().decode(target.objects.get('profile/avatar/done.png'))
    ).toBe('old');
  });

  it('is idempotent: a second run skips everything it copied', async (): Promise<void> => {
    const target = memoryStore({});
    await filesCopy(FILES, depsOf(target, false));
    const again = await filesCopy(FILES, depsOf(target, false));
    expect(
      again.filter((item): boolean => item.status === COPY_STATUS.COPIED)
    ).toEqual([]);
  });

  it('writes nothing in dry-run mode', async (): Promise<void> => {
    const target = memoryStore({});
    const results = await filesCopy(FILES, depsOf(target, true));
    expect(
      results.every((item): boolean => item.status === COPY_STATUS.PLANNED)
    ).toBe(true);
    expect(target.objects.size).toBe(0);
  });
});

describe('fixup SQL for failed copies', () => {
  it('restores a single value only when it still holds the migrated one', (): void => {
    expect(
      fixupStatement({
        table: TARGET_TABLE.USER,
        key: 'u1',
        column: 'image',
        mode: FILE_REF_MODE.VALUE,
        stored: 'https://new',
        fallback: 'https://old',
      })
    ).toBe(
      `UPDATE "user" SET "image" = 'https://old' WHERE "id" = 'u1' AND "image" = 'https://new';`
    );
  });

  it('removes one element from a JSON array column', (): void => {
    expect(
      fixupStatement({
        table: TARGET_TABLE.HACKATHON_SUBMISSION,
        key: 's1',
        column: 'screenshot_keys',
        mode: FILE_REF_MODE.ARRAY,
        stored: 'k',
        fallback: null,
      })
    ).toContain(
      `json_each("hackathon_submission"."screenshot_keys") WHERE value <> 'k'`
    );
  });
});
