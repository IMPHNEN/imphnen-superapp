import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  activityDetails,
} from '@app/activity';
import { HACKATHON_MESSAGE } from '@app/messages';
import {
  HACKATHON_DEADLINE,
  type THackathonTeam,
  type THackathonTeamCreateInput,
} from '@app/schemas';
import { Effect } from 'effect';
import {
  type EBadRequest,
  EConflict,
  type EDatabase,
  type ENotFound,
} from '#/shared/errors.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import type { TSessionUser } from '#/shared/session.ts';
import type { TStorageServiceId } from '#/platform/storage/storage-service.ts';
import {
  MembershipRepo,
  type TMembershipRepoId,
} from '#/hackathon/domain/membership-repo.ts';
import { TeamRepo, type TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { deadlineEnsure } from '#/hackathon/application/hackathon-guards.ts';
import { teamView } from '#/hackathon/application/team-view.ts';

export const teamCreate = Effect.fn('teamCreate')(function* (
  input: THackathonTeamCreateInput,
  actor: TSessionUser
): Effect.fn.Return<
  THackathonTeam,
  EBadRequest | EConflict | ENotFound | EDatabase,
  TTeamRepoId | TMembershipRepoId | TStorageServiceId | TActivityRecorderId
> {
  const teamRepo = yield* TeamRepo;
  const membershipRepo = yield* MembershipRepo;
  const activity = yield* ActivityRecorder;

  yield* deadlineEnsure(
    HACKATHON_DEADLINE.TEAM_FEATURES_CLOSE,
    HACKATHON_MESSAGE.TEAM_FEATURES_CLOSED
  );

  const existing = yield* membershipRepo.findByUser(actor.id);

  if (existing !== null) {
    return yield* new EConflict({ message: HACKATHON_MESSAGE.ALREADY_IN_TEAM });
  }

  const teamId = yield* teamRepo.create(input, {
    id: actor.id,
    email: actor.email.toLowerCase(),
  });

  yield* activity.insert({
    actorId: actor.id,
    action: ACTIVITY_ACTION.HACKATHON_TEAM_CREATE,
    resourceType: ACTIVITY_RESOURCE_TYPE.HACKATHON_TEAM,
    resourceId: teamId,
    metadata: activityDetails({ [ACTIVITY_DETAIL.NAME]: input.name }),
  });

  return yield* teamView(teamId, { userId: actor.id, canManage: false });
});
