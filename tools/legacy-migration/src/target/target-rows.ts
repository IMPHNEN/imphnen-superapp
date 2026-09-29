export type TSqlValue = string | number | null;

export type TSqlRow = Readonly<Record<string, TSqlValue>>;

export type TUserRow = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly email_verified: number;
  readonly image: string | null;
  readonly role: string;
  readonly is_active: number;
  readonly deleted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TAccountRow = {
  readonly id: string;
  readonly account_id: string;
  readonly provider_id: string;
  readonly user_id: string;
  readonly password: string;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TUserProfileRow = {
  readonly user_id: string;
  readonly avatar_key: string | null;
  readonly phone_number: string | null;
  readonly phone_for_verification: string | null;
  readonly gender: string | null;
  readonly birthdate: string | null;
  readonly domicile: string | null;
  readonly bio: string | null;
  readonly last_education: string | null;
  readonly linkedin_url: string | null;
  readonly github_url: string | null;
  readonly cv_url: string | null;
  readonly portfolio_url: string | null;
  readonly website_url: string | null;
  readonly twitter_url: string | null;
  readonly location: string | null;
  readonly skills: string;
  readonly experience: string;
  readonly education: string;
  readonly career_status: string | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TCustomRoleRow = {
  readonly id: string;
  readonly key: string;
  readonly label: string;
  readonly description: string | null;
  readonly permissions: string;
  readonly created_by: string | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TMentorRow = {
  readonly id: string;
  readonly user_id: string;
  readonly status: string;
  readonly legal_name: string | null;
  readonly gender: string | null;
  readonly domicile: string | null;
  readonly location: string | null;
  readonly phone_number: string | null;
  readonly phone_for_verification: string | null;
  readonly bio: string | null;
  readonly last_education: string | null;
  readonly linkedin_url: string | null;
  readonly github_url: string | null;
  readonly portfolio_url: string | null;
  readonly twitter_url: string | null;
  readonly identity_document_key: string | null;
  readonly cv_key: string | null;
  readonly cv_legacy_url: string | null;
  readonly industries: string;
  readonly expertise: string;
  readonly languages: string;
  readonly current_company: string | null;
  readonly current_role: string | null;
  readonly years_of_experience: number | null;
  readonly topics_of_interest: string;
  readonly preferred_mentee_level: string;
  readonly preferred_mentoring_formats: string;
  readonly availability_commitment: string | null;
  readonly mentoring_rate: number | null;
  readonly review_note: string | null;
  readonly reviewed_at: number | null;
  readonly reviewed_by: string | null;
  readonly deleted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TMentoringSessionRow = {
  readonly id: string;
  readonly mentor_user_id: string;
  readonly mentee_id: string;
  readonly topic: string;
  readonly description: string | null;
  readonly scheduled_at: number;
  readonly duration_minutes: number;
  readonly meeting_link: string | null;
  readonly session_type: string;
  readonly status: string;
  readonly feedback: string | null;
  readonly rating: number | null;
  readonly feedback_submitted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};
