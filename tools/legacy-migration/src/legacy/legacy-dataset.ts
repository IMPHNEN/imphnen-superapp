import { A, D } from '@mobily/ts-belt';
import type {
  TLegacyHackathonInvitation,
  TLegacyHackathonJoinRequest,
  TLegacyHackathonMember,
  TLegacyHackathonMessage,
  TLegacyHackathonSubmission,
  TLegacyHackathonTeam,
  TLegacyHackathonUser,
  TLegacyHackathonWinner,
} from './legacy-hackathon-rows.ts';
import type {
  TLegacyEvent,
  TLegacyGachaClaim,
  TLegacyGachaCredit,
  TLegacyGachaItem,
  TLegacyGachaPoolEntry,
  TLegacyMentor,
  TLegacyQrCampaign,
  TLegacyQrUser,
  TLegacyRoadmapItem,
  TLegacyRole,
  TLegacySession,
  TLegacyTestimonial,
  TLegacyUser,
} from './legacy-rows.ts';
import { LEGACY_TABLE, type TLegacyTable } from './legacy-table.ts';

export type TLegacyDataset = {
  readonly [LEGACY_TABLE.APP_USERS]: readonly TLegacyUser[];
  readonly [LEGACY_TABLE.APP_ROLES]: readonly TLegacyRole[];
  readonly [LEGACY_TABLE.APP_MENTORS]: readonly TLegacyMentor[];
  readonly [LEGACY_TABLE.SESSIONS]: readonly TLegacySession[];
  readonly [LEGACY_TABLE.APP_GACHA_ITEMS]: readonly TLegacyGachaItem[];
  readonly [LEGACY_TABLE.GACHA_ROLLS]: readonly TLegacyGachaPoolEntry[];
  readonly [LEGACY_TABLE.GACHA_CREDITS]: readonly TLegacyGachaCredit[];
  readonly [LEGACY_TABLE.APP_GACHA_CLAIMS]: readonly TLegacyGachaClaim[];
  readonly [LEGACY_TABLE.EVENTS]: readonly TLegacyEvent[];
  readonly [LEGACY_TABLE.TESTIMONIALS]: readonly TLegacyTestimonial[];
  readonly [LEGACY_TABLE.ROADMAP_ITEMS]: readonly TLegacyRoadmapItem[];
  readonly [LEGACY_TABLE.QR_CAMPAIGNS]: readonly TLegacyQrCampaign[];
  readonly [LEGACY_TABLE.QR_USERS]: readonly TLegacyQrUser[];
  readonly [LEGACY_TABLE.HACKATHON_USERS]: readonly TLegacyHackathonUser[];
  readonly [LEGACY_TABLE.HACKATHON_TEAMS]: readonly TLegacyHackathonTeam[];
  readonly [LEGACY_TABLE.HACKATHON_TEAM_MEMBERS]: readonly TLegacyHackathonMember[];
  readonly [LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS]: readonly TLegacyHackathonInvitation[];
  readonly [LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS]: readonly TLegacyHackathonJoinRequest[];
  readonly [LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS]: readonly TLegacyHackathonSubmission[];
  readonly [LEGACY_TABLE.HACKATHON_WINNERS]: readonly TLegacyHackathonWinner[];
  readonly [LEGACY_TABLE.HACKATHON_TEAM_MESSAGES]: readonly TLegacyHackathonMessage[];
};

export const EMPTY_DATASET: TLegacyDataset = D.fromPairs(
  A.map(D.values(LEGACY_TABLE), (table): readonly [TLegacyTable, []] => [
    table,
    [],
  ])
) as unknown as TLegacyDataset;

export const datasetOf = (
  partial: Partial<TLegacyDataset>
): TLegacyDataset => ({
  ...EMPTY_DATASET,
  ...partial,
});

export const sourceCountsOf = (
  dataset: TLegacyDataset
): Record<TLegacyTable, number> =>
  D.map(dataset, (rows): number => rows.length) as Record<TLegacyTable, number>;
