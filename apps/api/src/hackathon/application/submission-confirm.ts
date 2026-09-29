import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_SUBMISSION_STATUS,
  type THackathonIdInput,
  type THackathonSubmission,
} from '@app/schemas';
import { Effect } from 'effect';
import type {
  EBadRequest,
  EDatabase,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import type { TSubmissionRepoId } from '#/hackathon/domain/submission-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { submissionTransitionRun } from '#/hackathon/application/submission-transition.ts';

export const submissionConfirm = Effect.fn('submissionConfirm')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonSubmission,
  EBadRequest | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TSubmissionRepoId | TStorageServiceId | TActivityRecorderId
> {
  const activity = yield* ActivityRecorder;
  const submission = yield* submissionTransitionRun(
    {
      id,
      from: [HACKATHON_SUBMISSION_STATUS.PENDING],
      to: HACKATHON_SUBMISSION_STATUS.SUBMITTED,
      minMembers: 0,
      stampSubmittedAt: true,
    },
    actorId,
    {
      wrongStatus: HACKATHON_MESSAGE.SUBMISSION_NOT_PENDING,
      refused: HACKATHON_MESSAGE.SUBMISSION_NOT_PENDING,
    }
  );

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.HACKATHON_SUBMISSION_CONFIRM,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_SUBMISSION,
    resourceId: submission.id,
    metadata: activityDetails({
      [ACTIVITY_DETAIL.TITLE]: submission.projectName,
    }),
  });

  return submission;
});
