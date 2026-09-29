import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorDocumentUploadInput, TMentorPrivate } from '@app/schemas';
import { Effect } from 'effect';
import { match, P } from 'ts-pattern';
import { mentorActivityEntry } from '#/mentor/application/mentor-activity.ts';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import {
  MENTOR_DOCUMENT_MAX_BYTES,
  mentorDocumentExtensionOf,
  mentorDocumentKeyBuild,
  mentorDocumentKeyOf,
} from '#/mentor/domain/mentor-document.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  EBadRequest,
  type EDatabase,
  ENotFound,
  EStorage,
} from '#/shared/errors.ts';

type TUploadFile = TMentorDocumentUploadInput['file'];

const uploadBytes = (file: TUploadFile): Promise<ArrayBuffer> =>
  (file as unknown as Blob).arrayBuffer();

export const mentorDocumentUpload = Effect.fn('mentorDocumentUpload')(
  function* (
    input: TMentorDocumentUploadInput,
    userId: string
  ): Effect.fn.Return<
    TMentorPrivate,
    ENotFound | EBadRequest | EDatabase | EStorage,
    TMentorRepoId | TActivityRecorderId | TStorageServiceId
  > {
    const mentorRepo = yield* MentorRepo;
    const storage = yield* StorageService;
    const activityRecorder = yield* ActivityRecorder;

    const row = yield* mentorRepo.findByUserId(userId);

    if (row === null) {
      return yield* new ENotFound({
        message: MENTOR_MESSAGE.APPLICATION_NOT_FOUND,
      });
    }

    const extension = mentorDocumentExtensionOf(input.file.type);

    if (extension === undefined) {
      return yield* new EBadRequest({
        message: MENTOR_MESSAGE.DOCUMENT_TYPE_INVALID,
      });
    }

    if (input.file.size > MENTOR_DOCUMENT_MAX_BYTES) {
      return yield* new EBadRequest({
        message: MENTOR_MESSAGE.DOCUMENT_TOO_LARGE,
      });
    }

    const key = mentorDocumentKeyBuild(input.kind, extension);
    const body = yield* Effect.tryPromise({
      try: (): Promise<ArrayBuffer> => uploadBytes(input.file),
      catch: (cause) => new EStorage({ cause }),
    });
    yield* storage.put({ key, body, contentType: input.file.type });

    const updated = yield* mentorRepo.documentKeySet(row.id, input.kind, key);

    if (updated === null) {
      yield* Effect.ignore(storage.remove(key));
      return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
    }

    yield* match(mentorDocumentKeyOf(row, input.kind))
      .with(P.nullish, () => Effect.void)
      .otherwise((previous) => Effect.ignore(storage.remove(previous)));

    yield* activityRecorder.insert(
      mentorActivityEntry(
        userId,
        ACTIVITY_ACTION.MENTOR_DOCUMENT_UPLOAD,
        updated,
        {
          [ACTIVITY_DETAIL.LABEL]: input.kind,
          [ACTIVITY_DETAIL.BYTE_SIZE]: input.file.size,
        }
      )
    );

    return toMentorPrivateDto(updated);
  }
);
