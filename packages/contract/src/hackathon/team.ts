import {
  hackathonIdInputSchema,
  hackathonMemberRemoveInputSchema,
  hackathonParticipantIdInputSchema,
  hackathonParticipantPublicSchema,
  hackathonParticipantSchema,
  hackathonParticipantUpdateInputSchema,
  hackathonTeamBrowseInputSchema,
  hackathonTeamBrowseSchema,
  hackathonTeamCreateInputSchema,
  hackathonTeamSchema,
  hackathonTeamUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from '../http-methods.ts';
import { ROUTE_PATH } from '../route-paths.ts';

export const hackathonParticipantContract = {
  me: oc
    .route({
      method: HTTP_METHOD.GET,
      path: ROUTE_PATH.HACKATHON_PARTICIPANT_ME,
    })
    .output(hackathonParticipantSchema),

  updateMe: oc
    .route({
      method: HTTP_METHOD.PATCH,
      path: ROUTE_PATH.HACKATHON_PARTICIPANT_ME,
    })
    .input(hackathonParticipantUpdateInputSchema)
    .output(hackathonParticipantSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_PARTICIPANT })
    .input(hackathonParticipantIdInputSchema)
    .output(hackathonParticipantPublicSchema),
};

export const hackathonTeamContract = {
  browse: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_TEAMS })
    .input(hackathonTeamBrowseInputSchema)
    .output(hackathonTeamBrowseSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_TEAM })
    .input(hackathonIdInputSchema)
    .output(hackathonTeamSchema),

  mine: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.HACKATHON_TEAMS_MINE })
    .output(hackathonTeamSchema.nullable()),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.HACKATHON_TEAMS })
    .input(hackathonTeamCreateInputSchema)
    .output(hackathonTeamSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.HACKATHON_TEAM })
    .input(hackathonTeamUpdateInputSchema)
    .output(hackathonTeamSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.HACKATHON_TEAM })
    .input(hackathonIdInputSchema)
    .output(hackathonIdInputSchema),

  leave: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.HACKATHON_TEAM_LEAVE })
    .input(hackathonIdInputSchema)
    .output(hackathonIdInputSchema),

  memberRemove: oc
    .route({
      method: HTTP_METHOD.DELETE,
      path: ROUTE_PATH.HACKATHON_TEAM_MEMBER,
    })
    .input(hackathonMemberRemoveInputSchema)
    .output(hackathonTeamSchema),
};
