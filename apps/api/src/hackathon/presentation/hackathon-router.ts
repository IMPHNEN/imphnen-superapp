import { implementer } from '#/platform/orpc/implementer.ts';
import { adminRouter } from '#/hackathon/presentation/admin-router.ts';
import {
  certificateRouter,
  messageRouter,
  submissionRouter,
  uploadRouter,
  winnerRouter,
} from '#/hackathon/presentation/project-router.ts';
import {
  invitationRouter,
  joinRequestRouter,
} from '#/hackathon/presentation/requests-router.ts';
import {
  participantRouter,
  teamRouter,
} from '#/hackathon/presentation/team-router.ts';

const hackathonRouter = implementer.hackathon.router({
  participant: participantRouter,
  team: teamRouter,
  invitation: invitationRouter,
  joinRequest: joinRequestRouter,
  message: messageRouter,
  submission: submissionRouter,
  upload: uploadRouter,
  winner: winnerRouter,
  certificate: certificateRouter,
  admin: adminRouter,
});

export type THackathonRouter = typeof hackathonRouter;

export const hackathonRouterBuild = (): THackathonRouter => hackathonRouter;
