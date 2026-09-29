import {
  hackathonAdminListInputSchema,
  hackathonAdminParticipantListSchema,
  hackathonAdminTeamListSchema,
  hackathonIdInputSchema,
  hackathonSubmissionAdminListInputSchema,
  hackathonSubmissionAdminListSchema,
  hackathonTeamIdInputSchema,
  hackathonWinnerSchema,
  hackathonWinnerSetInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from '../http-methods.ts';
import { ROUTE_PATH } from '../route-paths.ts';

export const hackathonAdminContract = {
  participantList: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_ADMIN_PARTICIPANTS,
    })
    .input(hackathonAdminListInputSchema)
    .output(hackathonAdminParticipantListSchema),

  teamList: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_ADMIN_TEAMS })
    .input(hackathonAdminListInputSchema)
    .output(hackathonAdminTeamListSchema),

  teamRemove: oc
    .route({
      method: HTTP_METHOD.DELETE,
      path: ROUTE_PATH.HACKATHON_ADMIN_TEAM,
    })
    .input(hackathonIdInputSchema)
    .output(hackathonIdInputSchema),

  submissionList: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_ADMIN_SUBMISSIONS,
    })
    .input(hackathonSubmissionAdminListInputSchema)
    .output(hackathonSubmissionAdminListSchema),

  winnerSet: oc
    .route({
      method: HTTP_METHOD.POST,
      path: ROUTE_PATH.HACKATHON_ADMIN_WINNERS,
    })
    .input(hackathonWinnerSetInputSchema)
    .output(hackathonWinnerSchema),

  winnerRemove: oc
    .route({
      method: HTTP_METHOD.DELETE,
      path: ROUTE_PATH.HACKATHON_ADMIN_WINNER,
    })
    .input(hackathonTeamIdInputSchema)
    .output(hackathonTeamIdInputSchema),
};
