import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  HACKATHON_LIMIT,
  type THackathonSubmission,
  type THackathonSubmissionCreateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  EBadRequest,
  type EConflict,
  type EDatabase,
  type EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  SubmissionRepo,
  type TSubmissionRepoId,
} from '#/hackathon/domain/submission-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import {
  deadlineEnsure,
  leaderTeamFind,
} from '#/hackathon/application/hackathon-guards.ts';
import { toSubmissionDto } from '#/hackathon/application/to-activity-dto.ts';

export const submissionCreate = Effect.fn('submissionCreate')(function* (
  input: THackathonSubmissionCreateInput,
  actorId: string
): Effect.fn.Return<
  THackathonSubmission,
  EBadRequest | EConflict | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TSubmissionRepoId | TStorageServiceId
> {
  const submissionRepo = yield* SubmissionRepo;
  const { publicUrlOf } = yield* StorageService;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.SUBMISSION_CLOSE,
    HACKATHON_MESSAGE.SUBMISSION_CLOSED
  );
  yield* leaderTeamFind(input.teamId, actorId);

  const row = yield* submissionRepo.create(
    input,
    actorId,
    HACKATHON_LIMIT.SUBMIT_MIN_MEMBERS
  );

  if (row === null) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.SUBMISSION_TOO_FEW_MEMBERS,
    });
  }

  return toSubmissionDto(row, publicUrlOf);
});
