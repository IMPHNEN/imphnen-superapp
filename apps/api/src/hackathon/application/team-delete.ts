import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import type { THackathonIdInput } from '@app/schemas';
import { Effect } from 'effect';
import {
  EConflict,
  type EDatabase,
  type EForbidden,
  type ENotFound,
} from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { leaderTeamFind } from '#/hackathon/application/hackathon-guards.ts';

export const teamDelete = Effect.fn('teamDelete')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonIdInput,
  EConflict | EForbidden | ENotFound | EDatabase,
  TTeamRepoId | TActivityRecorderId
> {
  const teamRepo = yield* TeamRepo;
  const activity = yield* ActivityRecorder;
  const team = yield* leaderTeamFind(id, actorId);
  const removed = yield* teamRepo.removeIfAlone(id);

  if (!removed) {
    return yield* new EConflict({
      message: HACKATHON_MESSAGE.TEAM_HAS_MEMBERS,
    });
  }

  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.HACKATHON_TEAM_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_TEAM,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: team.name }),
  });

  return { id };
});
