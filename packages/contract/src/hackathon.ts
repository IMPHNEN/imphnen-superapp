import { hackathonAdminContract } from './hackathon/admin.ts';
import {
  hackathonCertificateContract,
  hackathonMessageContract,
  hackathonSubmissionContract,
  hackathonUploadContract,
  hackathonWinnerContract,
} from './hackathon/project.ts';
import {
  hackathonInvitationContract,
  hackathonJoinRequestContract,
} from './hackathon/requests.ts';
import {
  hackathonParticipantContract,
  hackathonTeamContract,
} from './hackathon/team.ts';

export const hackathonContract = {
  participant: hackathonParticipantContract,
  team: hackathonTeamContract,
  invitation: hackathonInvitationContract,
  joinRequest: hackathonJoinRequestContract,
  message: hackathonMessageContract,
  submission: hackathonSubmissionContract,
  upload: hackathonUploadContract,
  winner: hackathonWinnerContract,
  certificate: hackathonCertificateContract,
  admin: hackathonAdminContract,
};
