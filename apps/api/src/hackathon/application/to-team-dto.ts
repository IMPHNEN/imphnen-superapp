import {
  hackathonTeamSchema,
  hackathonTeamSummarySchema,
  type THackathonPerson,
  type THackathonTeam,
  type THackathonTeamMember,
  type THackathonTeamRef,
  type THackathonTeamSummary,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import type {
  TPersonRow,
  TTeamDetailRow,
  TTeamMemberRow,
  TTeamRefRow,
  TTeamSummaryRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import type { THackathonViewer, TUrlOf } from '#/hackathon/domain/viewer.ts';

export const urlOrNull = (urlOf: TUrlOf, key: string | null): string | null =>
  key === null ? null : urlOf(key);

export const toPersonDto = (row: TPersonRow): THackathonPerson => ({
  id: row.id,
  name: row.name,
  image: row.image,
});

export const toTeamRefDto = (
  row: TTeamRefRow,
  urlOf: TUrlOf
): THackathonTeamRef => ({
  id: row.id,
  name: row.name,
  logoUrl: urlOrNull(urlOf, row.logoKey),
});

const summaryFields = (
  row: TTeamSummaryRow,
  urlOf: TUrlOf
): THackathonTeamSummary => ({
  id: row.id,
  name: row.name,
  description: row.description,
  city: row.city,
  visibility: row.visibility,
  logoUrl: urlOrNull(urlOf, row.logoKey),
  bannerUrl: urlOrNull(urlOf, row.bannerKey),
  leader: toPersonDto(row.leader),
  memberCount: row.memberCount,
  hasSubmission: row.hasSubmission,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toTeamSummaryDto = (
  row: TTeamSummaryRow,
  urlOf: TUrlOf
): THackathonTeamSummary =>
  hackathonTeamSummarySchema.parse(summaryFields(row, urlOf));

export const canSeeContacts = (
  row: TTeamDetailRow,
  viewer: THackathonViewer
): boolean =>
  viewer.canManage ||
  A.some(row.members, (member) => member.user.id === viewer.userId);

const toMemberDto = (
  row: TTeamMemberRow,
  withContact: boolean
): THackathonTeamMember => ({
  user: toPersonDto(row.user),
  role: row.role,
  joinedAt: row.joinedAt.toISOString(),
  contact: withContact
    ? { email: row.email, phoneNumber: row.phoneNumber }
    : null,
});

export const toTeamDto = (
  row: TTeamDetailRow,
  urlOf: TUrlOf,
  viewer: THackathonViewer
): THackathonTeam => {
  const withContact = canSeeContacts(row, viewer);
  return hackathonTeamSchema.parse({
    ...summaryFields(row, urlOf),
    logoKey: row.logoKey,
    bannerKey: row.bannerKey,
    members: A.map(row.members, (member) => toMemberDto(member, withContact)),
  });
};
