export type TGachaItemRow = {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: string;
  readonly type: string;
  readonly category: string;
  readonly value: number;
  readonly weight: number;
  readonly stock: number;
  readonly is_limited: number;
  readonly metadata: string | null;
  readonly created_at: number;
  readonly updated_at: number;
  readonly deleted_at: number | null;
};

export type TGachaCreditRow = {
  readonly user_id: string;
  readonly balance: number;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TGachaClaimRow = {
  readonly id: string;
  readonly user_id: string;
  readonly item_id: string;
  readonly source: string;
  readonly status: string;
  readonly quantity: number;
  readonly fulfilled_at: number | null;
  readonly fulfilled_by: string | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TEventRow = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly detail_link: string;
  readonly price: number;
  readonly is_online: number;
  readonly location: string | null;
  readonly start_date: number;
  readonly end_date: number;
  readonly deleted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TTestimonialRow = {
  readonly id: string;
  readonly user_id: string;
  readonly role: string;
  readonly content: string;
  readonly status: string;
  readonly reviewed_by: string | null;
  readonly approved_at: number | null;
  readonly deleted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TRoadmapItemRow = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly legacy_votes: number;
  readonly deleted_at: number | null;
  readonly created_at: number;
  readonly updated_at: number;
};

export type TQrCampaignRow = {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly qr_image_key: string | null;
  readonly is_active: number;
  readonly created_by: string | null;
  readonly expires_at: number;
  readonly created_at: number;
  readonly updated_at: number;
};
