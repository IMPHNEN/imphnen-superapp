import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorDocumentDownloadInput } from '@app/schemas';
import { Effect } from 'effect';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import {
  MENTOR_DOCUMENT_FALLBACK_TYPE,
  mentorDocumentFileName,
  mentorDocumentKeyOf,
} from '#/mentor/domain/mentor-document.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { type EDatabase, ENotFound, EStorage } from '#/shared/errors.ts';

export const mentorDocumentDownload = Effect.fn('mentorDocumentDownload')(
  function* (
    input: TMentorDocumentDownloadInput
  ): Effect.fn.Return<
    File,
    ENotFound | EDatabase | EStorage,
    TMentorRepoId | TStorageServiceId
  > {
    const mentorRepo = yield* MentorRepo;
    const storage = yield* StorageService;

    const row = yield* mentorRepo.findById(input.id);

    if (row === null) {
      return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
    }

    const key = mentorDocumentKeyOf(row, input.kind);

    if (key === null) {
      return yield* new ENotFound({
        message: MENTOR_MESSAGE.DOCUMENT_NOT_FOUND,
      });
    }

    const object = yield* storage.get(key);

    if (object === null) {
      return yield* new ENotFound({
        message: MENTOR_MESSAGE.DOCUMENT_NOT_FOUND,
      });
    }

    const body = yield* Effect.tryPromise({
      try: (): Promise<ArrayBuffer> => object.arrayBuffer(),
      catch: (cause) => new EStorage({ cause }),
    });

    return new File([body], mentorDocumentFileName(key), {
      type: object.httpMetadata?.contentType ?? MENTOR_DOCUMENT_FALLBACK_TYPE,
    });
  }
);
