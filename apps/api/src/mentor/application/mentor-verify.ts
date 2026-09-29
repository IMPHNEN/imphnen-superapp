import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { MENTOR_MESSAGE } from '@app/messages';
import {
  MENTOR_REVIEW_DECISION,
  type TMentorPrivate,
  type TMentorReviewInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import { mentorActivityEntry } from '#/mentor/application/mentor-activity.ts';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import { mentorReviewAllowed } from '#/mentor/domain/mentor-status.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  EBadRequest,
  EConflict,
  type EDatabase,
  ENotFound,
} from '#/shared/errors.ts';

const REVIEW_ACTION = {
  [MENTOR_REVIEW_DECISION.APPROVE]: ACTIVITY_ACTION.MENTOR_APPROVE,
  [MENTOR_REVIEW_DECISION.REJECT]: ACTIVITY_ACTION.MENTOR_REJECT,
} as const;

export const mentorVerify = Effect.fn('mentorVerify')(function* (
  input: TMentorReviewInput,
  actorId: string
): Effect.fn.Return<
  TMentorPrivate,
  ENotFound | EConflict | EBadRequest | EDatabase,
  TMentorRepoId | TActivityRecorderId
> {
  const mentorRepo = yield* MentorRepo;
  const activityRecorder = yield* ActivityRecorder;

  const row = yield* mentorRepo.findById(input.id);

  if (row === null) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  if (!mentorReviewAllowed(row.status, input.decision)) {
    return yield* new EConflict({ message: MENTOR_MESSAGE.REVIEW_NOT_ALLOWED });
  }

  const documentMissing = match(input.decision)
    .with(
      MENTOR_REVIEW_DECISION.APPROVE,
      (): boolean => row.identityDocumentKey === null
    )
    .with(MENTOR_REVIEW_DECISION.REJECT, (): boolean => false)
    .exhaustive();

  if (documentMissing) {
    return yield* new EBadRequest({
      message: MENTOR_MESSAGE.IDENTITY_DOCUMENT_REQUIRED,
    });
  }

  const reviewed = yield* mentorRepo.review(input, actorId);

  if (reviewed === null) {
    return yield* new EConflict({ message: MENTOR_MESSAGE.REVIEW_NOT_ALLOWED });
  }

  yield* activityRecorder.insert(
    mentorActivityEntry(actorId, REVIEW_ACTION[input.decision], reviewed, {
      [ACTIVITY_DETAIL.LABEL]: reviewed.status,
    })
  );

  return toMentorPrivateDto(reviewed);
});
