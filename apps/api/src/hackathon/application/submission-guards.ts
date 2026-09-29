import { HACKATHON_MESSAGE } from '@app/messages';
import { Effect } from 'effect';
import { type EDatabase, type EForbidden, ENotFound } from '#/shared/errors.ts';
import type { TSubmissionRow } from '#/hackathon/domain/hackathon-rows.ts';
import {
  SubmissionRepo,
  type TSubmissionRepoId,
} from '#/hackathon/domain/submission-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { leaderTeamFind } from '#/hackathon/application/hackathon-guards.ts';

export const leaderSubmissionFind = Effect.fn('leaderSubmissionFind')(
  function* (
    id: string,
    actorId: string
  ): Effect.fn.Return<
    TSubmissionRow,
    ENotFound | EForbidden | EDatabase,
    TSubmissionRepoId | TTeamRepoId
  > {
    const submissionRepo = yield* SubmissionRepo;
    const submission = yield* submissionRepo.find(id);

    if (submission === null) {
      return yield* new ENotFound({
        message: HACKATHON_MESSAGE.SUBMISSION_NOT_FOUND,
      });
    }

    yield* leaderTeamFind(submission.teamId, actorId);
    return submission;
  }
);
