export type THackathonParticipantRow = {
  readonly user_id: string;
  readonly phone_number: string | null;
  readonly location: string | null;
  readonly bio: string | null;
  readonly skills: string;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonTeamRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly city: string;
  readonly visibility: string;
  readonly logo_key: string | null;
  readonly banner_key: string | null;
  readonly leader_id: string;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonMemberRow = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly role: string;
  readonly joined_at: number;
};

export type THackathonInvitationRow = {
  readonly id: string;
  readonly team_id: string;
  readonly inviter_id: string;
  readonly invitee_email: string;
  readonly status: string;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonJoinRequestRow = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly message: string;
  readonly status: string;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonSubmissionRow = {
  readonly id: string;
  readonly team_id: string;
  readonly project_name: string;
  readonly description: string;
  readonly repository_url: string;
  readonly demo_url: string | null;
  readonly presentation_url: string | null;
  readonly video_url: string | null;
  readonly screenshot_keys: string;
  readonly status: string;
  readonly submitted_at: number | null;
  readonly created_by: string | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonWinnerRow = {
  readonly id: string;
  readonly team_id: string;
  readonly rank: number;
  readonly prize: string | null;
  readonly announced_at: number;
  readonly created_at: number;
  readonly updated_at: number;
};

export type THackathonMessageRow = {
  readonly id: string;
  readonly team_id: string;
  readonly user_id: string;
  readonly body: string;
  readonly created_at: number;
};
