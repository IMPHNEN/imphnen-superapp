import { ROADMAP_STATUS } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { roadmapVote } from '#/roadmap/application/roadmap-vote.ts';
import { roadmapUpdate } from '#/roadmap/application/roadmap-write.ts';
import {
  RoadmapItemRepo,
  type TRoadmapItemRepoId,
  type TRoadmapItemRow,
} from '#/roadmap/domain/roadmap-item.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { ENotFound } from '#/shared/errors.ts';

const USER_ID = '22222222-2222-4222-8222-222222222222';
const ITEM_ID = '11111111-1111-4111-8111-111111111111';
const LEGACY_AND_NEW_VOTES = 8;

const row: TRoadmapItemRow = {
  id: ITEM_ID,
  title: 'Dark mode',
  description: 'Please',
  status: ROADMAP_STATUS.UPCOMING,
  votes: LEGACY_AND_NEW_VOTES,
  votedByMe: true,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

type TMocks = {
  findById: Mock;
  update: Mock;
  voteCast: Mock;
  voteWithdraw: Mock;
};

const mocksBuild = (found: TRoadmapItemRow | null): TMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(found)),
  update: vi.fn().mockReturnValue(Effect.succeed(found !== null)),
  voteCast: vi.fn().mockReturnValue(Effect.succeed(undefined)),
  voteWithdraw: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TRoadmapItemRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      RoadmapItemRepo,
      RoadmapItemRepo.of({
        list: vi.fn(),
        findById: mocks.findById,
        create: vi.fn(),
        update: mocks.update,
        softDelete: vi.fn(),
        voteCast: mocks.voteCast,
        voteWithdraw: mocks.voteWithdraw,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({
        insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      })
    )
  );

describe('roadmapVote', () => {
  it('casts one vote for the signed-in user and reports the derived total', async (): Promise<void> => {
    const mocks = mocksBuild(row);

    const result = await Effect.runPromise(
      roadmapVote({ id: ITEM_ID, voted: true }, USER_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.voteCast).toHaveBeenCalledWith(ITEM_ID, USER_ID);
    expect(mocks.voteWithdraw).not.toHaveBeenCalled();
    expect(result).toEqual({
      id: ITEM_ID,
      votes: LEGACY_AND_NEW_VOTES,
      votedByMe: true,
    });
  });

  it('withdraws the vote when the user toggles it off', async (): Promise<void> => {
    const mocks = mocksBuild(row);

    await Effect.runPromise(
      roadmapVote({ id: ITEM_ID, voted: false }, USER_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.voteWithdraw).toHaveBeenCalledWith(ITEM_ID, USER_ID);
    expect(mocks.voteCast).not.toHaveBeenCalled();
  });

  it('refuses a vote on a missing or deleted item', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      roadmapVote({ id: ITEM_ID, voted: true }, USER_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.voteCast).not.toHaveBeenCalled();
  });
});

describe('roadmapUpdate', () => {
  it('fails with ENotFound when the item is missing or deleted', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      roadmapUpdate(
        {
          id: ITEM_ID,
          title: row.title,
          description: row.description,
          status: ROADMAP_STATUS.COMPLETED,
        },
        USER_ID
      ).pipe(Effect.provide(layerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
