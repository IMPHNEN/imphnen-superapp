import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { hackathonTeamSummarySchema } from './team.ts';
import { HACKATHON_LIMIT } from './constants.ts';

const skillsSchema = z
  .array(z.string().trim().min(1).max(HACKATHON_LIMIT.SKILL_MAX))
  .max(HACKATHON_LIMIT.SKILLS_MAX);

export const hackathonParticipantSchema = z.object({
  userId: userIdSchema,
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  location: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
});
export type THackathonParticipant = z.infer<typeof hackathonParticipantSchema>;

export const hackathonParticipantPublicSchema = z.object({
  userId: userIdSchema,
  name: z.string(),
  image: z.string().nullable(),
  location: z.string().nullable(),
  bio: z.string().nullable(),
  skills: z.array(z.string()),
  team: hackathonTeamSummarySchema.nullable(),
});
export type THackathonParticipantPublic = z.infer<
  typeof hackathonParticipantPublicSchema
>;

export const hackathonParticipantUpdateInputSchema = z.object({
  phoneNumber: z.string().trim().max(HACKATHON_LIMIT.PHONE_MAX).nullish(),
  location: z.string().trim().max(HACKATHON_LIMIT.NAME_MAX).nullish(),
  bio: z.string().max(HACKATHON_LIMIT.TEXT_MAX).nullish(),
  skills: skillsSchema.optional(),
});
export type THackathonParticipantUpdateInput = z.infer<
  typeof hackathonParticipantUpdateInputSchema
>;

export const hackathonParticipantIdInputSchema = z.object({
  userId: userIdSchema,
});
export type THackathonParticipantIdInput = z.infer<
  typeof hackathonParticipantIdInputSchema
>;
