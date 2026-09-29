import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonTeamIdInput } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  type TWinnerRepoId,
  WinnerRepo,
} from '#/hackathon/domain/award-repo.ts';

export const winnerRemove = Effect.fn('winnerRemove')(function* (
  { teamId }: THackathonTeamIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonTeamIdInput,
  ENotFound | EDatabase,
  TWinnerRepoId | TActivityRecorderId
> {
  const winnerRepo = yield* WinnerRepo;
  const activity = yield* ActivityRecorder;
  const removed = yield* winnerRepo.remove(teamId);

  if (!removed) {
    return yield* new ENotFound({
      message: HACKATHON_MESSAGE.WINNER_NOT_FOUND,
    });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.HACKATHON_WINNER_REMOVE,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_WINNER,
    resourceId: teamId,
  });

  return { teamId };
});
