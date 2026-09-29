import {
  hackathonAdminParticipantSchema,
  hackathonCertificateSchema,
  hackathonParticipantPublicSchema,
  hackathonParticipantSchema,
  hackathonWinnerSchema,
  type THackathonAdminParticipant,
  type THackathonCertificate,
  type THackathonParticipant,
  type THackathonParticipantPublic,
  type THackathonTeamSummary,
  type THackathonWinner,
} from '@app/schemas';
import { HACKATHON_MEMBER_ROLE } from '@app/schemas';
import type {
  TCertificateRow,
  TParticipantRow,
  TWinnerRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import type { TAdminParticipantRow } from '#/hackathon/domain/admin-repo.ts';
import type { TUrlOf } from '#/hackathon/domain/viewer.ts';
import {
  toTeamRefDto,
  urlOrNull,
} from '#/hackathon/application/to-team-dto.ts';

export const toParticipantDto = (row: TParticipantRow): THackathonParticipant =>
  hackathonParticipantSchema.parse({
    userId: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
    phoneNumber: row.phoneNumber,
    location: row.location,
    bio: row.bio,
    skills: row.skills,
  });

export const toParticipantPublicDto = (
  row: TParticipantRow,
  team: THackathonTeamSummary | null
): THackathonParticipantPublic =>
  hackathonParticipantPublicSchema.parse({
    userId: row.userId,
    name: row.name,
    image: row.image,
    location: row.location,
    bio: row.bio,
    skills: row.skills,
    team,
  });

export const toAdminParticipantDto = (
  row: TAdminParticipantRow,
  urlOf: TUrlOf
): THackathonAdminParticipant =>
  hackathonAdminParticipantSchema.parse({
    userId: row.userId,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    phoneNumber: row.phoneNumber,
    location: row.location,
    team: row.team === null ? null : toTeamRefDto(row.team, urlOf),
    createdAt: row.createdAt.toISOString(),
  });

export const toWinnerDto = (row: TWinnerRow, urlOf: TUrlOf): THackathonWinner =>
  hackathonWinnerSchema.parse({
    id: row.id,
    rank: row.rank,
    prize: row.prize,
    announcedAt: row.announcedAt.toISOString(),
    team: {
      id: row.team.id,
      name: row.team.name,
      city: row.team.city,
      logoUrl: urlOrNull(urlOf, row.team.logoKey),
    },
    projectName: row.projectName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

export const toCertificateDto = (
  row: TCertificateRow,
  urlOf: TUrlOf
): THackathonCertificate =>
  hackathonCertificateSchema.parse({
    id: row.id,
    recipient: { id: row.userId, name: row.userName },
    team: toTeamRefDto(row.team, urlOf),
    isLeader: row.role === HACKATHON_MEMBER_ROLE.LEADER,
    project: {
      name: row.projectName,
      submittedAt: row.submittedAt?.toISOString() ?? null,
    },
    winner: row.rank === null ? null : { rank: row.rank, prize: row.prize },
  });
