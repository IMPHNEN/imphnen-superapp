import type { TUserList, TUserListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { toUserDto } from '#/user/application/to-user-dto.ts';
import { UserRepo, type TUserRepoId } from '#/user/domain/user.ts';

export const userList = Effect.fn('userList')(function* (
  input: TUserListInput
): Effect.fn.Return<TUserList, EDatabase, TUserRepoId> {
  const userRepo = yield* UserRepo;
  const { items, total } = yield* userRepo.list(input);
  return {
    items: A.map(items, toUserDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
