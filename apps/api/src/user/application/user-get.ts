import { USER_MESSAGE } from '@app/messages';
import type { TUser, TUserIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { ENotFound, type EDatabase } from '#/shared/errors.ts';
import { toUserDto } from '#/user/application/to-user-dto.ts';
import { UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userGet = Effect.fn('userGet')(function* ({
  id,
}: TUserIdInput): Effect.fn.Return<TUser, ENotFound | EDatabase, TUserRepoId> {
  const userRepo = yield* UserRepo;
  const row = yield* userRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  return toUserDto(row);
});
