export type TEpochMs = number;

export type TLegacyUser = {
  readonly id: string;
  readonly email: string;
  readonly password_hash: string | null;
  readonly role_id: string | null;
  readonly first_name: string | null;
  readonly last_name: string | null;
  readonly avatar_url: string | null;
  readonly is_verified: boolean;
  readonly is_active: boolean;
  readonly metadata: string | null;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
  readonly deleted_at: TEpochMs | null;
};

export type TLegacyRole = {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly permissions: string | null;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
  readonly deleted_at: TEpochMs | null;
};

export type TLegacyMentor = {
  readonly id: string | null;
  readonly user_id: string;
  readonly industries: string | null;
  readonly expertise: string | null;
  readonly languages: string | null;
  readonly current_company: string | null;
  readonly current_role: string | null;
  readonly years_of_experience: number | null;
  readonly topics_of_interest: string | null;
  readonly preferred_mentee_level: string | null;
  readonly preferred_mentoring_formats: string | null;
  readonly availability_commitment: string | null;
  readonly mentoring_rate: number | null;
  readonly status: string | null;
  readonly is_deleted: boolean;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacySession = {
  readonly id: string;
  readonly mentor_id: string;
  readonly mentee_id: string;
  readonly topic: string;
  readonly description: string | null;
  readonly scheduled_at: TEpochMs;
  readonly duration_minutes: number;
  readonly meeting_link: string | null;
  readonly session_type: string;
  readonly status: string;
  readonly feedback: string | null;
  readonly rating: number | null;
  readonly feedback_submitted_at: TEpochMs | null;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacyGachaItem = {
  readonly id: string;
  readonly item_code: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: string;
  readonly type: string;
  readonly category: string;
  readonly value: number;
  readonly weight: number;
  readonly stock: number;
  readonly is_limited: boolean;
  readonly metadata: string | null;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
  readonly deleted_at: TEpochMs | null;
};

export type TLegacyGachaPoolEntry = {
  readonly id: string;
  readonly item_id: string;
  readonly weight: number;
  readonly quantity: number;
  readonly is_deleted: boolean;
  readonly created_at: TEpochMs | null;
};

export type TLegacyGachaCredit = {
  readonly id: string;
  readonly user_id: string;
  readonly available_rolls: number;
  readonly is_deleted: boolean;
  readonly created_at: TEpochMs | null;
  readonly updated_at: TEpochMs | null;
};

export type TLegacyGachaClaim = {
  readonly id: string;
  readonly user_id: string;
  readonly gacha_item_id: string;
  readonly claim_type: string;
  readonly status: string;
  readonly quantity: number;
  readonly metadata: string | null;
  readonly claimed_at: TEpochMs;
  readonly updated_at: TEpochMs;
  readonly deleted_at: TEpochMs | null;
};

export type TLegacyEvent = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly detail_link: string;
  readonly price: number;
  readonly is_online: boolean;
  readonly is_deleted: boolean;
  readonly location: string | null;
  readonly start_date: TEpochMs;
  readonly end_date: TEpochMs;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacyTestimonial = {
  readonly id: string;
  readonly user_id: string;
  readonly role: string;
  readonly content: string;
  readonly is_deleted: boolean;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacyRoadmapItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly votes: number;
  readonly is_deleted: boolean;
  readonly created_at: TEpochMs;
  readonly updated_at: TEpochMs;
};

export type TLegacyQrCampaign = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly qr_code_base64: string | null;
  readonly is_active: boolean;
  readonly created_by: string | null;
  readonly expires_at: TEpochMs;
  readonly created_at: TEpochMs | null;
  readonly updated_at: TEpochMs | null;
};

export type TLegacyQrUser = {
  readonly id: string;
  readonly email: string;
  readonly role: string;
};
