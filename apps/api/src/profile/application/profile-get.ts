import { PROFILE_MESSAGE } from '@app/messages';
import type { TProfile } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import { toProfileDto } from '#/profile/application/to-profile-dto.ts';
import { ProfileRepo, type TProfileRepoId } from '#/profile/domain/profile.ts';

export const profileGet = Effect.fn('profileGet')(function* (
  userId: string
): Effect.fn.Return<TProfile, ENotFound | EDatabase, TProfileRepoId> {
  const profileRepo = yield* ProfileRepo;
  const row = yield* profileRepo.findByUserId(userId);

  if (row === null) {
    return yield* new ENotFound({ message: PROFILE_MESSAGE.NOT_FOUND });
  }

  return toProfileDto(row);
});
