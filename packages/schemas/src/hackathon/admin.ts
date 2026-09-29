import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { hackathonTeamRefSchema } from './common.ts';
import { hackathonSubmissionStatusSchema } from './submission.ts';
import { hackathonTeamSummarySchema } from './team.ts';

export const hackathonAdminListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
});
export type THackathonAdminListInput = z.infer<
  typeof hackathonAdminListInputSchema
>;

export const hackathonAdminParticipantSchema = z.object({
  userId: userIdSchema,
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  role: z.string(),
  phoneNumber: z.string().nullable(),
  location: z.string().nullable(),
  team: hackathonTeamRefSchema.nullable(),
  createdAt: z.iso.datetime(),
});
export type THackathonAdminParticipant = z.infer<
  typeof hackathonAdminParticipantSchema
>;

export const hackathonAdminParticipantListSchema = paginated(
  hackathonAdminParticipantSchema
);
export type THackathonAdminParticipantList = z.infer<
  typeof hackathonAdminParticipantListSchema
>;

export const hackathonAdminTeamSchema = hackathonTeamSummarySchema.extend({
  submissionStatus: hackathonSubmissionStatusSchema.nullable(),
});
export type THackathonAdminTeam = z.infer<typeof hackathonAdminTeamSchema>;

export const hackathonAdminTeamListSchema = paginated(hackathonAdminTeamSchema);
export type THackathonAdminTeamList = z.infer<
  typeof hackathonAdminTeamListSchema
>;
