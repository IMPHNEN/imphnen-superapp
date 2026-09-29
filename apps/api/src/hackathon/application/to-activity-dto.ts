import {
  hackathonInvitationSchema,
  hackathonJoinRequestSchema,
  hackathonMessageSchema,
  hackathonSubmissionSchema,
  type THackathonInvitation,
  type THackathonJoinRequest,
  type THackathonMessage,
  type THackathonSubmission,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import type {
  TInvitationRow,
  TJoinRequestRow,
  TMessageRow,
  TSubmissionRow,
} from '#/hackathon/domain/hackathon-rows.ts';
import type { TUrlOf } from '#/hackathon/domain/viewer.ts';
import {
  toPersonDto,
  toTeamRefDto,
} from '#/hackathon/application/to-team-dto.ts';

export const toInvitationDto = (
  row: TInvitationRow,
  urlOf: TUrlOf
): THackathonInvitation =>
  hackathonInvitationSchema.parse({
    id: row.id,
    team: toTeamRefDto(row.team, urlOf),
    inviter: toPersonDto(row.inviter),
    inviteeEmail: row.inviteeEmail,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

export const toJoinRequestDto = (
  row: TJoinRequestRow,
  urlOf: TUrlOf
): THackathonJoinRequest =>
  hackathonJoinRequestSchema.parse({
    id: row.id,
    team: toTeamRefDto(row.team, urlOf),
    user: toPersonDto(row.user),
    message: row.message,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

export const toMessageDto = (row: TMessageRow): THackathonMessage =>
  hackathonMessageSchema.parse({
    id: row.id,
    teamId: row.teamId,
    author: toPersonDto(row.author),
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  });

export const toSubmissionFields = (
  row: TSubmissionRow,
  urlOf: TUrlOf
): THackathonSubmission => ({
  id: row.id,
  teamId: row.teamId,
  projectName: row.projectName,
  description: row.description,
  repositoryUrl: row.repositoryUrl,
  demoUrl: row.demoUrl,
  presentationUrl: row.presentationUrl,
  videoUrl: row.videoUrl,
  screenshots: A.map(row.screenshotKeys, (key) => ({ key, url: urlOf(key) })),
  status: row.status,
  submittedAt: row.submittedAt?.toISOString() ?? null,
  createdBy: row.createdBy,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export const toSubmissionDto = (
  row: TSubmissionRow,
  urlOf: TUrlOf
): THackathonSubmission =>
  hackathonSubmissionSchema.parse(toSubmissionFields(row, urlOf));
