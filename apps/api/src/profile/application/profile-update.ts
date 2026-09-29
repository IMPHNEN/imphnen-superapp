import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetailList,
  activityDetails,
} from '@app/activity';
import { PROFILE_MESSAGE } from '@app/messages';
import type { TProfile, TProfileUpdateInput } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import { toProfileDto } from '#/profile/application/to-profile-dto.ts';
import { ProfileRepo, type TProfileRepoId } from '#/profile/domain/profile.ts';

const NAME_FIELD = 'name';

const changedFieldsOf = (input: TProfileUpdateInput): readonly string[] => [
  ...(input.name === undefined ? [] : [NAME_FIELD]),
  ...D.keys(input.extension ?? {}),
];

export const profileUpdate = Effect.fn('profileUpdate')(function* (
  userId: string,
  input: TProfileUpdateInput
): Effect.fn.Return<
  TProfile,
  ENotFound | EDatabase,
  TProfileRepoId | TActivityRecorderId
> {
  const profileRepo = yield* ProfileRepo;
  const activityRepo = yield* ActivityRecorder;

  const row = yield* profileRepo.update(userId, input);

  if (row === null) {
    return yield* new ENotFound({ message: PROFILE_MESSAGE.NOT_FOUND });
  }

  const changed = changedFieldsOf(input);

  yield* match(A.isEmpty(changed))
    .with(true, () => Effect.void)
    .with(false, () =>
      activityRepo.insert({
        actorId: userId,
        action: ACTIVITY_ACTION.PROFILE_UPDATE,
        resourceType: ACTIVITY_RESOURCE_TYPE.PROFILE,
        resourceId: userId,
        metadata: activityDetails({
          [ACTIVITY_DETAIL.CHANGED_FIELDS]: activityDetailList(changed),
        }),
      })
    )
    .exhaustive();

  return toProfileDto(row);
});
