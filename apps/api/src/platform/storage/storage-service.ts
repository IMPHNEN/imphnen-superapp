import { Context, Effect, Layer } from 'effect';
import { env } from '#/platform/config/env.ts';
import { SERVICE_TAG } from '#/platform/service-tags.ts';
import { bucketFor, isPrivateKey } from '#/platform/storage/storage-buckets.ts';
import { EStorage } from '#/shared/errors.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TStoragePut = {
  readonly key: string;
  readonly body: ReadableStream | ArrayBuffer | Uint8Array | string | Blob;
  readonly contentType: string;
};

export type TStorageService = {
  readonly put: (input: TStoragePut) => Effect.Effect<string, EStorage>;
  readonly remove: (key: string) => Effect.Effect<void, EStorage>;
  readonly get: (key: string) => Effect.Effect<R2ObjectBody | null, EStorage>;
  readonly publicUrlOf: (key: string) => string;
};

export type TStorageServiceId = TServiceId<typeof SERVICE_TAG.STORAGE>;

export const StorageService = Context.Service<
  TStorageServiceId,
  TStorageService
>(SERVICE_TAG.STORAGE);

const PRIVATE_URL = '';

const publicUrlOf = (key: string): string =>
  isPrivateKey(key)
    ? PRIVATE_URL
    : new URL(key, `${env.STORAGE_PUBLIC_URL.replace(/\/$/, '')}/`).toString();

export const storageServiceLayer = Layer.effect(
  StorageService,
  Effect.sync(() =>
    StorageService.of({
      put: (input) =>
        Effect.tryPromise({
          try: async (): Promise<string> => {
            await bucketFor(input.key).put(input.key, input.body, {
              httpMetadata: { contentType: input.contentType },
            });
            return publicUrlOf(input.key);
          },
          catch: (cause) => new EStorage({ cause }),
        }),
      remove: (key) =>
        Effect.tryPromise({
          try: (): Promise<void> => bucketFor(key).delete(key),
          catch: (cause) => new EStorage({ cause }),
        }),
      get: (key) =>
        Effect.tryPromise({
          try: (): Promise<R2ObjectBody | null> => bucketFor(key).get(key),
          catch: (cause) => new EStorage({ cause }),
        }),
      publicUrlOf,
    })
  )
);
