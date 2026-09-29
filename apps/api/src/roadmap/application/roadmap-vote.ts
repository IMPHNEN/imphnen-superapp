import type { TRoadmapVote, TRoadmapVoteInput } from '@app/schemas';
import { Effect } from 'effect';
import { roadmapFind } from '#/roadmap/application/roadmap-read.ts';
import {
  RoadmapItemRepo,
  type TRoadmapItemRepoId,
} from '#/roadmap/domain/roadmap-item.ts';
import type { EDatabase, ENotFound } from '#/shared/errors.ts';

export const roadmapVote = Effect.fn('roadmapVote')(function* (
  { id, voted }: TRoadmapVoteInput,
  userId: string
): Effect.fn.Return<TRoadmapVote, ENotFound | EDatabase, TRoadmapItemRepoId> {
  const roadmapRepo = yield* RoadmapItemRepo;

  yield* roadmapFind(id, userId);

  yield* voted
    ? roadmapRepo.voteCast(id, userId)
    : roadmapRepo.voteWithdraw(id, userId);

  const after = yield* roadmapFind(id, userId);

  return { id, votes: after.votes, votedByMe: after.votedByMe };
});
