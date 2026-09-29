import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  type THackathonSubmission,
  type THackathonSubmissionUpdateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  EBadRequest,
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
import { deadlineEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { leaderSubmissionFind } from '#/hackathon/application/submission-guards.ts';
import { toSubmissionDto } from '#/hackathon/application/to-activity-dto.ts';

export const submissionUpdate = Effect.fn('submissionUpdate')(function* (
  input: THackathonSubmissionUpdateInput,
  actorId: string
): Effect.fn.Return<
  THackathonSubmission,
  EBadRequest | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TSubmissionRepoId | TStorageServiceId
> {
  const submissionRepo = yield* SubmissionRepo;
  const { publicUrlOf } = yield* StorageService;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.SUBMISSION_CLOSE,
    HACKATHON_MESSAGE.SUBMISSION_CLOSED
  );
  yield* leaderSubmissionFind(input.id, actorId);

  const row = yield* submissionRepo.updateDraft(input);

  if (row === null) {
    return yield* new EBadRequest({
      message: HACKATHON_MESSAGE.SUBMISSION_NOT_DRAFT,
    });
  }

  return toSubmissionDto(row, publicUrlOf);
});
