import type {
  THackathonDecisionStatus,
  THackathonMemberRole,
  THackathonSubmissionStatus,
  THackathonTeamVisibility,
} from '@app/schemas';
import type { TBaseRow } from '#/shared/base-row.ts';

export type TPersonRow = {
  id: string;
  name: string;
  image: string | null;
};

export type TTeamRow = TBaseRow & {
  name: string;
  description: string | null;
  city: string;
  visibility: THackathonTeamVisibility;
  logoKey: string | null;
  bannerKey: string | null;
  leaderId: string;
};

export type TTeamSummaryRow = TTeamRow & {
  leader: TPersonRow;
  memberCount: number;
  hasSubmission: boolean;
};

export type TTeamMemberRow = {
  user: TPersonRow;
  role: THackathonMemberRole;
  joinedAt: Date;
  email: string;
  phoneNumber: string | null;
};

export type TTeamDetailRow = TTeamSummaryRow & {
  members: readonly TTeamMemberRow[];
};

export type TMembershipRow = {
  teamId: string;
  userId: string;
  role: THackathonMemberRole;
};

export type TTeamState = {
  exists: boolean;
  memberCount: number;
  hasSubmission: boolean;
};

export type TParticipantRow = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  phoneNumber: string | null;
  location: string | null;
  bio: string | null;
  skills: readonly string[];
  registered: boolean;
};

export type TTeamRefRow = {
  id: string;
  name: string;
  logoKey: string | null;
};

export type TInvitationRow = TBaseRow & {
  team: TTeamRefRow;
  inviter: TPersonRow;
  inviteeEmail: string;
  status: THackathonDecisionStatus;
};

export type TJoinRequestRow = TBaseRow & {
  team: TTeamRefRow;
  user: TPersonRow;
  userEmail: string;
  message: string;
  status: THackathonDecisionStatus;
};

export type TMessageRow = {
  id: string;
  teamId: string;
  author: TPersonRow;
  body: string;
  createdAt: Date;
};

export type TSubmissionRow = TBaseRow & {
  teamId: string;
  projectName: string;
  description: string;
  repositoryUrl: string;
  demoUrl: string | null;
  presentationUrl: string | null;
  videoUrl: string | null;
  screenshotKeys: readonly string[];
  status: THackathonSubmissionStatus;
  submittedAt: Date | null;
  createdBy: string | null;
};

export type TWinnerRow = TBaseRow & {
  rank: number;
  prize: string | null;
  announcedAt: Date;
  team: TTeamRefRow & { city: string };
  projectName: string | null;
};

export type TCertificateRow = {
  id: string;
  userId: string;
  userName: string;
  team: TTeamRefRow;
  role: THackathonMemberRole;
  projectName: string;
  submittedAt: Date | null;
  rank: number | null;
  prize: string | null;
};
