import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { PROFILE_MESSAGE } from '@app/messages';
import type { TProfile, TProfileAvatarUploadInput } from '@app/schemas';
import { Effect } from 'effect';
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
  type EStorage,
} from '#/shared/errors.ts';
import {
  AVATAR_POLICY,
  avatarFormatOf,
  avatarKeyOf,
} from '#/profile/domain/avatar-policy.ts';
import { ProfileRepo, type TProfileRepoId } from '#/profile/domain/profile.ts';
import { toProfileDto } from '#/profile/application/to-profile-dto.ts';

const headerOf = (file: File): Effect.Effect<Uint8Array> =>
  Effect.promise(
    async (): Promise<Uint8Array> =>
      new Uint8Array(
        await file.slice(0, AVATAR_POLICY.HEADER_BYTES).arrayBuffer()
      )
  );

const uploadOf = (input: TProfileAvatarUploadInput): File =>
  input.file as unknown as File;

export const profileAvatarUpload = Effect.fn('profileAvatarUpload')(function* (
  userId: string,
  input: TProfileAvatarUploadInput
): Effect.fn.Return<
  TProfile,
  EBadRequest | ENotFound | EDatabase | EStorage,
  TProfileRepoId | TStorageServiceId | TActivityRecorderId
> {
  const profileRepo = yield* ProfileRepo;
  const storage = yield* StorageService;
  const activityRepo = yield* ActivityRecorder;
  const file = uploadOf(input);

  const format = avatarFormatOf(file.type);

  if (format === null) {
    return yield* new EBadRequest({ message: PROFILE_MESSAGE.AVATAR_TYPE });
  }

  if (file.size > AVATAR_POLICY.MAX_BYTES) {
    return yield* new EBadRequest({
      message: PROFILE_MESSAGE.AVATAR_TOO_LARGE,
    });
  }

  const header = yield* headerOf(file);

  if (!format.matches(header)) {
    return yield* new EBadRequest({
      message: PROFILE_MESSAGE.AVATAR_CONTENT_MISMATCH,
    });
  }

  const row = yield* profileRepo.findByUserId(userId);

  if (row === null) {
    return yield* new ENotFound({ message: PROFILE_MESSAGE.NOT_FOUND });
  }

  const key = avatarKeyOf(format, crypto.randomUUID());
  const url = yield* storage.put({ key, body: file, contentType: format.mime });
  const previousKey = yield* profileRepo.avatarSet(userId, { key, url });

  yield* Effect.ignore(
    previousKey === null ? Effect.void : storage.remove(previousKey)
  );
  yield* activityRepo.insert({
    actorId: userId,
    action: ACTIVITY_ACTION.PROFILE_AVATAR_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.PROFILE,
    resourceId: userId,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.FILE_NAME]: file.name,
      [ACTIVITY_DETAIL.BYTE_SIZE]: file.size,
    }),
  });

  return toProfileDto({ ...row, user: { ...row.user, image: url } });
});
