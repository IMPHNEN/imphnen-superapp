import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonWinner, THackathonWinnerSetInput } from '@app/schemas';
import { Effect } from 'effect';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  type TWinnerRepoId,
  WinnerRepo,
} from '#/hackathon/domain/award-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { teamFind } from '#/hackathon/application/hackathon-guards.ts';
import { toWinnerDto } from '#/hackathon/application/to-award-dto.ts';

export const winnerSet = Effect.fn('winnerSet')(function* (
  input: THackathonWinnerSetInput,
  actorId: string
): Effect.fn.Return<
  THackathonWinner,
  ENotFound | EDatabase,
  TTeamRepoId | TWinnerRepoId | TStorageServiceId | TActivityRecorderId
> {
  const winnerRepo = yield* WinnerRepo;
  const activity = yield* ActivityRecorder;
  const { publicUrlOf } = yield* StorageService;
  const team = yield* teamFind(input.teamId);
  const row = yield* winnerRepo.upsert(input);

  if (row === null) {
    return yield* new ENotFound({ message: HACKATHON_MESSAGE.TEAM_NOT_FOUND });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.HACKATHON_WINNER_SET,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_WINNER,
    resourceId: team.id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: team.name }),
  });

  return toWinnerDto(row, publicUrlOf);
});
