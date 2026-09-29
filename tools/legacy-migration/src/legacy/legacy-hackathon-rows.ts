import type { TEpochMs } from './legacy-rows.ts';

export type TLegacyHackathonUser = {
  readonly id: string;
  readonly email: string;
  readonly fullname: string;
  readonly avatar: string | null;
  readonly phone_number: string | null;
  readonly location: string | null;
  readonly bio: string | null;
  readonly skills: string | null;
  readonly is_admin: boolean | null;
  readonly created_at: TEpochMs | null;
  readonly updated_at: TEpochMs | null;
};

export type TLegacyHackathonTeam = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly city: string;
  readonly visibility: string;
  readonly logo: string | null;
  readonly banner: string | null;
  readonly leader_id: string;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacyHackathonMember = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly role: string;
  readonly status: string;
  readonly joined_at: TEpochMs | null;
};

export type TLegacyHackathonInvitation = {
  readonly id: string;
  readonly team_id: string;
  readonly inviter_id: string;
  readonly invitee_email: string;
  readonly status: string;
  readonly created_at: TEpochMs | null;
};

export type TLegacyHackathonJoinRequest = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly message: string | null;
  readonly status: string;
  readonly created_at: TEpochMs | null;
};

export type TLegacyHackathonSubmission = {
  readonly id: string;
  readonly team_id: string;
  readonly project_name: string;
  readonly description: string;
  readonly repository_url: string;
  readonly demo_url: string | null;
  readonly presentation_url: string | null;
  readonly screenshots: string | null;
  readonly status: string;
  readonly submitted_at: TEpochMs | null;
  readonly submitted_by: string;
  readonly created_at: TEpochMs | null;
  readonly updated_at: TEpochMs | null;
};

export type TLegacyHackathonWinner = {
  readonly id: string;
  readonly team_id: string;
  readonly rank: number;
  readonly prize: string | null;
  readonly announced_at: TEpochMs | null;
  readonly created_at: TEpochMs | null;
  readonly updated_at: TEpochMs | null;
};

export type TLegacyHackathonMessage = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly message: string;
  readonly created_at: TEpochMs | null;
};
