import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import type { THackathonIdInput } from '@app/schemas';
import { Effect } from 'effect';
import type { EDatabase, ENotFound } from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { teamFind } from '#/hackathon/application/hackathon-guards.ts';

export const adminTeamDelete = Effect.fn('adminTeamDelete')(function* (
  { id }: THackathonIdInput,
  actorId: string
): Effect.fn.Return<
  THackathonIdInput,
  ENotFound | EDatabase,
  TTeamRepoId | TActivityRecorderId
> {
  const teamRepo = yield* TeamRepo;
  const activity = yield* ActivityRecorder;
  const team = yield* teamFind(id);

  yield* teamRepo.remove(id);
  yield* activity.insert({
    actorId,
    action: ACTIVITY_ACTION.HACKATHON_TEAM_DELETE,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_TEAM,
    resourceId: id,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: team.name }),
  });

  return { id };
});
