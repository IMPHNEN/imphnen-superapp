import { PERMISSION } from '@app/permissions';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { adminParticipantList } from '#/hackathon/application/admin-participant-list.ts';
import { adminSubmissionList } from '#/hackathon/application/admin-submission-list.ts';
import { adminTeamList } from '#/hackathon/application/admin-team-list.ts';
import { adminTeamDelete } from '#/hackathon/application/admin-team-delete.ts';
import { winnerRemove } from '#/hackathon/application/winner-remove.ts';
import { winnerSet } from '#/hackathon/application/winner-set.ts';

const manage = (): ReturnType<typeof permissionGuarded> =>
  permissionGuarded(PERMISSION.HACKATHON_MANAGE);

export const adminRouter = implementer.hackathon.admin.router({
  participantList: manage().hackathon.admin.participantList.handler(
    ({ input, context }) =>
      effectRun(context.runtime, adminParticipantList(input))
  ),

  teamList: manage().hackathon.admin.teamList.handler(({ input, context }) =>
    effectRun(context.runtime, adminTeamList(input))
  ),

  teamRemove: manage().hackathon.admin.teamRemove.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        adminTeamDelete(input, context.session.user.id)
      )
  ),

  submissionList: manage().hackathon.admin.submissionList.handler(
    ({ input, context }) =>
      effectRun(context.runtime, adminSubmissionList(input))
  ),

  winnerSet: manage().hackathon.admin.winnerSet.handler(({ input, context }) =>
    effectRun(context.runtime, winnerSet(input, context.session.user.id))
  ),

  winnerRemove: manage().hackathon.admin.winnerRemove.handler(
    ({ input, context }) =>
      effectRun(context.runtime, winnerRemove(input, context.session.user.id))
  ),
});
