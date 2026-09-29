import {
  hackathonDecisionInputSchema,
  hackathonDecisionResultSchema,
  hackathonInvitationCreateInputSchema,
  hackathonInvitationListSchema,
  hackathonInvitationSchema,
  hackathonJoinRequestCreateInputSchema,
  hackathonJoinRequestListSchema,
  hackathonJoinRequestSchema,
  hackathonTeamIdInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from '../http-methods.ts';
import { ROUTE_PATH } from '../route-paths.ts';

export const hackathonInvitationContract = {
  mine: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_INVITATIONS_MINE,
    })
    .output(hackathonInvitationListSchema),

  create: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_TEAM_INVITATIONS,
    })
    .input(hackathonInvitationCreateInputSchema)
    .output(hackathonInvitationSchema),

  respond: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_INVITATION_RESPOND,
    })
    .input(hackathonDecisionInputSchema)
    .output(hackathonDecisionResultSchema),
};

export const hackathonJoinRequestContract = {
  mine: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_JOIN_REQUESTS_MINE,
    })
    .output(hackathonJoinRequestListSchema),

  create: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_TEAM_JOIN_REQUESTS,
    })
    .input(hackathonJoinRequestCreateInputSchema)
    .output(hackathonJoinRequestSchema),

  teamPending: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_TEAM_JOIN_REQUESTS,
    })
    .input(hackathonTeamIdInputSchema)
    .output(hackathonJoinRequestListSchema),

  respond: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_JOIN_REQUEST_RESPOND,
    })
    .input(hackathonDecisionInputSchema)
    .output(hackathonDecisionResultSchema),
};
