import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_IMAGE_EXTENSION,
  HACKATHON_LIMIT,
  HACKATHON_STORAGE_PREFIX,
  HACKATHON_UPLOAD_KIND,
  type THackathonUpload,
  type THackathonUploadInput,
  type THackathonUploadKind,
} from '@app/schemas';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import { EBadRequest, type EStorage } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  IMAGE_SIGNATURE_LENGTH,
  imageTypeOf,
} from '#/hackathon/domain/image-signature.ts';

const prefixOf = (kind: THackathonUploadKind): string =>
  match(kind)
    .with(HACKATHON_UPLOAD_KIND.TEAM_LOGO, () => HACKATHON_STORAGE_PREFIX.TEAM)
    .with(
      HACKATHON_UPLOAD_KIND.TEAM_BANNER,
      () => HACKATHON_STORAGE_PREFIX.TEAM
    )
    .with(
      HACKATHON_UPLOAD_KIND.SUBMISSION_SCREENSHOT,
      () => HACKATHON_STORAGE_PREFIX.SUBMISSION
    )
    .exhaustive();

export const uploadCreate = Effect.fn('uploadCreate')(function* (
  input: THackathonUploadInput
): Effect.fn.Return<
  THackathonUpload,
  EBadRequest | EStorage,
  TStorageServiceId
> {
  const storage = yield* StorageService;
  const file = input.file;

  if (!(file instanceof Blob)) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.UPLOAD_TYPE_INVALID,
    });
  }

  if (file.size > HACKATHON_LIMIT.UPLOAD_MAX_BYTES) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.UPLOAD_TOO_LARGE,
    });
  }

  const header = yield* Effect.tryPromise({
    try: async () =>
      new Uint8Array(await file.slice(0, IMAGE_SIGNATURE_LENGTH).arrayBuffer()),
    catch: () =>
      new EBadRequest({ message: HACKATHON_MESSAGE.UPLOAD_TYPE_INVALID }),
  });
  const type = imageTypeOf(header);

  if (type === null) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.UPLOAD_TYPE_INVALID,
    });
  }

  const key = `${prefixOf(input.kind)}${crypto.randomUUID()}.${HACKATHON_IMAGE_EXTENSION[type]}`;
  const url = yield* storage.put({ key, body: file, contentType: type });

  return { key, url };
});
