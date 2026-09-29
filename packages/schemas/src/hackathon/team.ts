import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import {
  hackathonCitySchema,
  hackathonContactSchema,
  hackathonIdSchema,
  hackathonPersonSchema,
  hackathonTeamImageKeySchema,
} from './common.ts';
import {
  HACKATHON_LIMIT,
  HACKATHON_MEMBER_ROLE,
  HACKATHON_TEAM_VISIBILITY,
} from './constants.ts';

export const hackathonTeamVisibilitySchema = z.enum([
  HACKATHON_TEAM_VISIBILITY.PUBLIC,
  HACKATHON_TEAM_VISIBILITY.PRIVATE,
]);

export const hackathonMemberRoleSchema = z.enum([
  HACKATHON_MEMBER_ROLE.LEADER,
  HACKATHON_MEMBER_ROLE.MEMBER,
]);

export const hackathonTeamMemberSchema = z.object({
  user: hackathonPersonSchema,
  role: hackathonMemberRoleSchema,
  joinedAt: z.iso.datetime(),
  contact: hackathonContactSchema.nullable(),
});
export type THackathonTeamMember = z.infer<typeof hackathonTeamMemberSchema>;

export const hackathonTeamSummarySchema = baseSchema(hackathonIdSchema).extend({
  name: z.string(),
  description: z.string().nullable(),
  city: z.string(),
  visibility: hackathonTeamVisibilitySchema,
  logoUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  leader: hackathonPersonSchema,
  memberCount: z.number().int().min(0),
  hasSubmission: z.boolean(),
});
export type THackathonTeamSummary = z.infer<typeof hackathonTeamSummarySchema>;

export const hackathonTeamSchema = hackathonTeamSummarySchema.extend({
  logoKey: z.string().nullable(),
  bannerKey: z.string().nullable(),
  members: z.array(hackathonTeamMemberSchema),
});
export type THackathonTeam = z.infer<typeof hackathonTeamSchema>;

const nameSchema = z.string().trim().min(1).max(HACKATHON_LIMIT.NAME_MAX);
const descriptionSchema = z.string().max(HACKATHON_LIMIT.TEXT_MAX);

export const hackathonTeamCreateInputSchema = z.object({
  name: nameSchema,
  description: descriptionSchema.optional(),
  city: hackathonCitySchema,
  visibility: hackathonTeamVisibilitySchema,
  logoKey: hackathonTeamImageKeySchema.optional(),
  bannerKey: hackathonTeamImageKeySchema.optional(),
});
export type THackathonTeamCreateInput = z.infer<
  typeof hackathonTeamCreateInputSchema
>;

export const hackathonTeamUpdateInputSchema = z.object({
  id: hackathonIdSchema,
  name: nameSchema.optional(),
  description: descriptionSchema.nullish(),
  city: hackathonCitySchema.optional(),
  visibility: hackathonTeamVisibilitySchema.optional(),
  logoKey: hackathonTeamImageKeySchema.nullish(),
  bannerKey: hackathonTeamImageKeySchema.nullish(),
});
export type THackathonTeamUpdateInput = z.infer<
  typeof hackathonTeamUpdateInputSchema
>;

export const hackathonTeamBrowseInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  city: z.string().optional(),
  minMembers: z.coerce.number().int().min(0).optional(),
  maxMembers: z.coerce.number().int().min(0).optional(),
  hasSubmission: z.boolean().optional(),
});
export type THackathonTeamBrowseInput = z.infer<
  typeof hackathonTeamBrowseInputSchema
>;

export const hackathonTeamBrowseSchema = paginated(hackathonTeamSummarySchema);
export type THackathonTeamBrowse = z.infer<typeof hackathonTeamBrowseSchema>;

export const hackathonMemberRemoveInputSchema = z.object({
  teamId: hackathonIdSchema,
  userId: userIdSchema,
});
export type THackathonMemberRemoveInput = z.infer<
  typeof hackathonMemberRemoveInputSchema
>;
