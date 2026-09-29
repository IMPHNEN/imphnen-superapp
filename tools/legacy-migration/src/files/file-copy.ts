import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { FILE_SOURCE_KIND, type TFileCopy } from '../pipeline/step-types.ts';
import { sequential } from '../shared/sequential.ts';
import type { TObjectStore } from './object-store.ts';

export const COPY_STATUS = {
  COPIED: 'copied',
  SKIPPED: 'skipped',
  PLANNED: 'planned',
  FAILED: 'failed',
} as const;

export type TCopyStatus = (typeof COPY_STATUS)[keyof typeof COPY_STATUS];

export type TCopyResult = {
  readonly targetKey: string;
  readonly status: TCopyStatus;
  readonly detail: string;
};

export type TCopyDeps = {
  readonly legacy: TObjectStore;
  readonly target: TObjectStore;
  readonly fetchUrl: (url: string) => Promise<Uint8Array | null>;
  readonly dryRun: boolean;
  readonly concurrency: number;
};

const BASE64 = 'base64';
const SOURCE_MISSING = 'source object not found';

const bytesOf = (
  file: TFileCopy,
  deps: TCopyDeps
): Promise<Uint8Array | null> =>
  match(file.source)
    .with(
      { kind: FILE_SOURCE_KIND.S3 },
      (source): Promise<Uint8Array | null> => deps.legacy.get(source.key)
    )
    .with(
      { kind: FILE_SOURCE_KIND.URL },
      (source): Promise<Uint8Array | null> => deps.fetchUrl(source.url)
    )
    .with(
      { kind: FILE_SOURCE_KIND.INLINE },
      async (source): Promise<Uint8Array | null> =>
        new Uint8Array(Buffer.from(source.base64, BASE64))
    )
    .exhaustive();

const describe = (file: TFileCopy): string =>
  match(file.source)
    .with({ kind: FILE_SOURCE_KIND.S3 }, (source): string => source.key)
    .with({ kind: FILE_SOURCE_KIND.URL }, (source): string => source.url)
    .with(
      { kind: FILE_SOURCE_KIND.INLINE },
      (): string => FILE_SOURCE_KIND.INLINE
    )
    .exhaustive();

const result = (
  file: TFileCopy,
  status: TCopyStatus,
  detail: string
): TCopyResult => ({
  targetKey: file.targetKey,
  status,
  detail,
});

const transfer = async (
  file: TFileCopy,
  deps: TCopyDeps
): Promise<TCopyResult> => {
  const bytes = await bytesOf(file, deps);
  return bytes === null
    ? result(file, COPY_STATUS.FAILED, `${SOURCE_MISSING}: ${describe(file)}`)
    : deps.target
        .put(file.targetKey, bytes, file.contentType)
        .then(
          (): TCopyResult => result(file, COPY_STATUS.COPIED, describe(file))
        );
};

const copyOne = async (
  file: TFileCopy,
  deps: TCopyDeps
): Promise<TCopyResult> => {
  try {
    const exists = await deps.target.exists(file.targetKey);
    return await match({ exists, dryRun: deps.dryRun })
      .with(
        { exists: true },
        async (): Promise<TCopyResult> =>
          result(file, COPY_STATUS.SKIPPED, describe(file))
      )
      .with(
        { dryRun: true },
        async (): Promise<TCopyResult> =>
          result(file, COPY_STATUS.PLANNED, describe(file))
      )
      .otherwise((): Promise<TCopyResult> => transfer(file, deps));
  } catch (error) {
    return result(
      file,
      COPY_STATUS.FAILED,
      error instanceof Error ? error.message : String(error)
    );
  }
};

export const filesCopy = async (
  files: readonly TFileCopy[],
  deps: TCopyDeps
): Promise<readonly TCopyResult[]> =>
  A.flat(
    await sequential(
      A.splitEvery(files, Math.max(1, deps.concurrency)),
      (batch): Promise<readonly TCopyResult[]> =>
        Promise.all(
          A.map(batch, (file): Promise<TCopyResult> => copyOne(file, deps))
        )
    )
  );
