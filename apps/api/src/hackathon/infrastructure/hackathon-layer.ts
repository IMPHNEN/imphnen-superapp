import { Layer } from 'effect';
import { adminRepoLayer } from '#/hackathon/infrastructure/admin-repository.ts';
import {
  certificateRepoLayer,
  winnerRepoLayer,
} from '#/hackathon/infrastructure/award-repository.ts';
import { invitationRepoLayer } from '#/hackathon/infrastructure/invitation-repository.ts';
import { joinRequestRepoLayer } from '#/hackathon/infrastructure/join-request-repository.ts';
import { membershipRepoLayer } from '#/hackathon/infrastructure/membership-repository.ts';
import { messageRepoLayer } from '#/hackathon/infrastructure/message-repository.ts';
import { participantRepoLayer } from '#/hackathon/infrastructure/participant-repository.ts';
import { submissionRepoLayer } from '#/hackathon/infrastructure/submission-repository.ts';
import { teamRepoLayer } from '#/hackathon/infrastructure/team-repository.ts';

export const hackathonRepoLayer = Layer.mergeAll(
  participantRepoLayer,
  teamRepoLayer,
  membershipRepoLayer,
  invitationRepoLayer,
  joinRequestRepoLayer,
  messageRepoLayer,
  submissionRepoLayer,
  winnerRepoLayer,
  certificateRepoLayer,
  adminRepoLayer
);
