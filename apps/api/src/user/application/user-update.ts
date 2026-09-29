import { USER_MESSAGE } from '@app/messages';
import type { TUser, TUserUpdateInput } from '@app/schemas';
import { Effect } from 'effect';
import { match, P } from 'ts-pattern';
import { roleEnsure } from '#/role/index.ts';
import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetailPrevious,
  activityDetails,
  type TActivityDetails,
} from '@app/activity';
import {
  type EBadRequest,
  type EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import { toUserDto } from '#/user/application/to-user-dto.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { TCustomRoleRepoId } from '#/role/index.ts';
import {
  UserRepo,
  type TUserRepoId,
  type TUserRow,
} from '#/user/domain/user.ts';

const changedTo = (previous: string, next: string): string | undefined =>
  previous === next ? undefined : next;

const updateDetails = (previous: TUserRow, next: TUserRow): TActivityDetails =>
  activityDetails({
    [ACTIVITY_DETAIL.ROLE]: changedTo(previous.role, next.role),
    [ACTIVITY_DETAIL.PREVIOUS_ROLE]: activityDetailPrevious(
      previous.role,
      next.role
    ),
    [ACTIVITY_DETAIL.NAME]: changedTo(previous.name, next.name),
    [ACTIVITY_DETAIL.PREVIOUS_NAME]: activityDetailPrevious(
      previous.name,
      next.name
    ),
  });

export const userUpdate = Effect.fn('userUpdate')(function* (
  input: TUserUpdateInput,
  actorId: string
): Effect.fn.Return<
  TUser,
  ENotFound | EForbidden | EBadRequest | EDatabase,
  TUserRepoId | TCustomRoleRepoId | TActivityRecorderId
> {
  const userRepo = yield* UserRepo;
  const activityRepo = yield* ActivityRecorder;

  if (input.role !== undefined && input.id === actorId) {
    return yield* new EForbidden({ message: USER_MESSAGE.SELF_ROLE_CHANGE });
  }

  yield* match(input.role)
    .with(P.nullish, () => Effect.void)
    .otherwise((role) => roleEnsure(role));

  const previous = yield* userRepo.findById(input.id);

  if (previous === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  const updated = yield* userRepo.update(input);

  if (updated === null) {
    return yield* new ENotFound({ message: USER_MESSAGE.NOT_FOUND });
  }

  yield* activityRepo.insert({
    actorId,
    action: ACTIVITY_ACTION.USER_UPDATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.USER,
    resourceId: updated.id,
    metadata: updateDetails(previous, updated),
  });

  return toUserDto(updated);
});
