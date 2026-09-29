import type { THackathonSubmission } from '@app/schemas';
import { A } from '@mobily/ts-belt';
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
  type TSubmissionTransition,
} from '#/hackathon/domain/submission-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { leaderSubmissionFind } from '#/hackathon/application/submission-guards.ts';
import { toSubmissionDto } from '#/hackathon/application/to-activity-dto.ts';

export type TTransitionMessages = {
  wrongStatus: string;
  refused: string;
};

export const submissionTransitionRun = Effect.fn('submissionTransitionRun')(
  function* (
    transition: TSubmissionTransition,
    actorId: string,
    messages: TTransitionMessages
  ): Effect.fn.Return<
    THackathonSubmission,
    EBadRequest | EForbidden | ENotFound | EDatabase,
    TTeamRepoId | TSubmissionRepoId | TStorageServiceId
  > {
    const submissionRepo = yield* SubmissionRepo;
    const { publicUrlOf } = yield* StorageService;
    const current = yield* leaderSubmissionFind(transition.id, actorId);

    if (!A.includes(transition.from, current.status)) {
      return yield* new EBadRequest({ message: messages.wrongStatus });
    }

    const row = yield* submissionRepo.transition(transition);

    if (row === null) {
      return yield* new EBadRequest({ message: messages.refused });
    }

    return toSubmissionDto(row, publicUrlOf);
  }
);
