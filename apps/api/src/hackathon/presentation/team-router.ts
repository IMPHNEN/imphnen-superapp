import { PERMISSION } from '@app/permissions';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { participantGet } from '#/hackathon/application/participant-get.ts';
import { participantMe } from '#/hackathon/application/participant-me.ts';
import { participantUpdate } from '#/hackathon/application/participant-update.ts';
import { teamBrowse } from '#/hackathon/application/team-browse.ts';
import { teamCreate } from '#/hackathon/application/team-create.ts';
import { teamDelete } from '#/hackathon/application/team-delete.ts';
import { teamGet } from '#/hackathon/application/team-get.ts';
import { teamLeave } from '#/hackathon/application/team-leave.ts';
import { teamMemberRemove } from '#/hackathon/application/team-member-remove.ts';
import { teamMine } from '#/hackathon/application/team-mine.ts';
import { teamUpdate } from '#/hackathon/application/team-update.ts';
import { viewerOf } from '#/hackathon/presentation/viewer-of.ts';

const participate = (): ReturnType<typeof permissionGuarded> =>
  permissionGuarded(PERMISSION.HACKATHON_PARTICIPATE);

export const participantRouter = implementer.hackathon.participant.router({
  me: participate().hackathon.participant.me.handler(({ context }) =>
    effectRun(context.runtime, participantMe(context.session.user.id))
  ),

  updateMe: participate().hackathon.participant.updateMe.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        participantUpdate(input, context.session.user.id)
      )
  ),

  get: participate().hackathon.participant.get.handler(({ input, context }) =>
    effectRun(context.runtime, participantGet(input))
  ),
});

export const teamRouter = implementer.hackathon.team.router({
  browse: implementer.hackathon.team.browse.handler(({ input, context }) =>
    effectRun(context.runtime, teamBrowse(input))
  ),

  get: implementer.hackathon.team.get.handler(({ input, context }) =>
    effectRun(context.runtime, teamGet(input, viewerOf(context)))
  ),

  mine: participate().hackathon.team.mine.handler(({ context }) =>
    effectRun(context.runtime, teamMine(context.session.user.id))
  ),

  create: participate().hackathon.team.create.handler(({ input, context }) =>
    effectRun(context.runtime, teamCreate(input, context.session.user))
  ),

  update: participate().hackathon.team.update.handler(({ input, context }) =>
    effectRun(context.runtime, teamUpdate(input, context.session.user.id))
  ),

  remove: participate().hackathon.team.remove.handler(({ input, context }) =>
    effectRun(context.runtime, teamDelete(input, context.session.user.id))
  ),

  leave: participate().hackathon.team.leave.handler(({ input, context }) =>
    effectRun(context.runtime, teamLeave(input, context.session.user.id))
  ),

  memberRemove: participate().hackathon.team.memberRemove.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        teamMemberRemove(input, context.session.user.id)
      )
  ),
});
