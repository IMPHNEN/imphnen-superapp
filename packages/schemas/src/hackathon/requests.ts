import { z } from 'zod';
import { baseSchema } from '../shared/base-schema.ts';
import {
  hackathonIdSchema,
  hackathonPersonSchema,
  hackathonTeamRefSchema,
} from './common.ts';
import { HACKATHON_DECISION_STATUS, HACKATHON_LIMIT } from './constants.ts';

export const hackathonDecisionStatusSchema = z.enum([
  HACKATHON_DECISION_STATUS.PENDING,
  HACKATHON_DECISION_STATUS.ACCEPTED,
  HACKATHON_DECISION_STATUS.REJECTED,
]);

export const hackathonInvitationSchema = baseSchema(hackathonIdSchema).extend({
  team: hackathonTeamRefSchema,
  inviter: hackathonPersonSchema,
  inviteeEmail: z.email(),
  status: hackathonDecisionStatusSchema,
});
export type THackathonInvitation = z.infer<typeof hackathonInvitationSchema>;

export const hackathonInvitationListSchema = z.object({
  items: z.array(hackathonInvitationSchema).readonly(),
});
export type THackathonInvitationList = z.infer<
  typeof hackathonInvitationListSchema
>;

export const hackathonInvitationCreateInputSchema = z.object({
  teamId: hackathonIdSchema,
  email: z.email(),
});
export type THackathonInvitationCreateInput = z.infer<
  typeof hackathonInvitationCreateInputSchema
>;

export const hackathonJoinRequestSchema = baseSchema(hackathonIdSchema).extend({
  team: hackathonTeamRefSchema,
  user: hackathonPersonSchema,
  message: z.string(),
  status: hackathonDecisionStatusSchema,
});
export type THackathonJoinRequest = z.infer<typeof hackathonJoinRequestSchema>;

export const hackathonJoinRequestListSchema = z.object({
  items: z.array(hackathonJoinRequestSchema).readonly(),
});
export type THackathonJoinRequestList = z.infer<
  typeof hackathonJoinRequestListSchema
>;

export const hackathonJoinRequestCreateInputSchema = z.object({
  teamId: hackathonIdSchema,
  message: z.string().max(HACKATHON_LIMIT.SHORT_TEXT_MAX).default(''),
});
export type THackathonJoinRequestCreateInput = z.infer<
  typeof hackathonJoinRequestCreateInputSchema
>;

export const hackathonDecisionResultSchema = z.object({
  id: hackathonIdSchema,
  status: hackathonDecisionStatusSchema,
});
export type THackathonDecisionResult = z.infer<
  typeof hackathonDecisionResultSchema
>;
