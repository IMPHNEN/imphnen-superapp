import { PERMISSION } from '@app/permissions';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';
import { invitationCreate } from '#/hackathon/application/invitation-create.ts';
import { invitationMine } from '#/hackathon/application/invitation-mine.ts';
import { invitationRespond } from '#/hackathon/application/invitation-respond.ts';
import { joinRequestCreate } from '#/hackathon/application/join-request-create.ts';
import { joinRequestMine } from '#/hackathon/application/join-request-mine.ts';
import { joinRequestRespond } from '#/hackathon/application/join-request-respond.ts';
import { joinRequestTeamPending } from '#/hackathon/application/join-request-team-pending.ts';

const participate = (): ReturnType<typeof permissionGuarded> =>
  permissionGuarded(PERMISSION.HACKATHON_PARTICIPATE);

export const invitationRouter = implementer.hackathon.invitation.router({
  mine: participate().hackathon.invitation.mine.handler(({ context }) =>
    effectRun(context.runtime, invitationMine(context.session.user.email))
  ),

  create: participate().hackathon.invitation.create.handler(
    ({ input, context }) =>
      effectRun(context.runtime, invitationCreate(input, context.session.user))
  ),

  respond: participate().hackathon.invitation.respond.handler(
    ({ input, context }) =>
      effectRun(context.runtime, invitationRespond(input, context.session.user))
  ),
});

export const joinRequestRouter = implementer.hackathon.joinRequest.router({
  mine: participate().hackathon.joinRequest.mine.handler(({ context }) =>
    effectRun(context.runtime, joinRequestMine(context.session.user.id))
  ),

  create: participate().hackathon.joinRequest.create.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        joinRequestCreate(input, context.session.user.id)
      )
  ),

  teamPending: participate().hackathon.joinRequest.teamPending.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        joinRequestTeamPending(input, context.session.user.id)
      )
  ),

  respond: participate().hackathon.joinRequest.respond.handler(
    ({ input, context }) =>
      effectRun(
        context.runtime,
        joinRequestRespond(input, context.session.user.id)
      )
  ),
});
