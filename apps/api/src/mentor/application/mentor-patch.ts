import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  activityDetailList,
} from '@app/activity';
import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorPrivate, TMentorProfilePatch } from '@app/schemas';
import { D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { mentorActivityEntry } from '#/mentor/application/mentor-activity.ts';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import {
  MentorRepo,
  type TMentorRepoId,
  type TMentorRow,
} from '#/mentor/domain/mentor.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentorPatchApply = Effect.fn('mentorPatchApply')(function* (
  row: TMentorRow,
  patch: TMentorProfilePatch,
  actorId: string
): Effect.fn.Return<
  TMentorPrivate,
  ENotFound | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const activityRecorder = yield* ActivityRecorder;

  const updated = yield* mentorRepo.update(row.id, patch);

  if (updated === null) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  yield* activityRecorder.insert(
    mentorActivityEntry(actorId, ACTIVITY_ACTION.MENTOR_UPDATE, updated, {
      [ACTIVITY_DETAIL.CHANGED_FIELDS]: activityDetailList(D.keys(patch)),
    })
  );

  return toMentorPrivateDto(updated);
});
