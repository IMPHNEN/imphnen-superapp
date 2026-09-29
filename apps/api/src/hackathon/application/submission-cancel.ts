import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
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
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import type { TSubmissionRepoId } from '#/hackathon/domain/submission-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { deadlineEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { submissionTransitionRun } from '#/hackathon/application/submission-transition.ts';

export const submissionCancel = Effect.fn('submissionCancel')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonSubmission,
  EBadRequest | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TSubmissionRepoId | TStorageServiceId
> {
  yield* deadlineEnsure(
    HACKATHON_DEADLINE.SUBMISSION_CLOSE,
    HACKATHON_MESSAGE.SUBMISSION_CLOSED
  );

  return yield* submissionTransitionRun(
    {
      id,
      from: [
        HACKATHON_SUBMISSION_STATUS.DRAFT,
        HACKATHON_SUBMISSION_STATUS.PENDING,
      ],
      to: HACKATHON_SUBMISSION_STATUS.DRAFT,
      minMembers: 0,
      stampSubmittedAt: false,
    },
    actorId,
    {
      wrongStatus: HACKATHON_MESSAGE.SUBMISSION_CONFIRMED,
      refused: HACKATHON_MESSAGE.SUBMISSION_CONFIRMED,
    }
  );
});
