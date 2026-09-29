import { z } from 'zod';
import { eventSchema } from '../shared/base-schema.ts';
import { hackathonIdSchema, hackathonPersonSchema } from './common.ts';
import { HACKATHON_LIMIT } from './constants.ts';

export const hackathonMessageSchema = eventSchema(hackathonIdSchema).extend({
  teamId: hackathonIdSchema,
  author: hackathonPersonSchema,
  body: z.string(),
});
export type THackathonMessage = z.infer<typeof hackathonMessageSchema>;

export const hackathonMessageListInputSchema = z.object({
  teamId: hackathonIdSchema,
  before: hackathonIdSchema.optional(),
  after: hackathonIdSchema.optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(HACKATHON_LIMIT.MESSAGE_PAGE_MAX)
    .default(HACKATHON_LIMIT.MESSAGE_PAGE_DEFAULT),
});
export type THackathonMessageListInput = z.infer<
  typeof hackathonMessageListInputSchema
>;

export const hackathonMessageListSchema = z.object({
  items: z.array(hackathonMessageSchema).readonly(),
  hasMore: z.boolean(),
});
export type THackathonMessageList = z.infer<typeof hackathonMessageListSchema>;

export const hackathonMessageSendInputSchema = z.object({
  teamId: hackathonIdSchema,
  body: z.string().trim().min(1).max(HACKATHON_LIMIT.TEXT_MAX),
});
export type THackathonMessageSendInput = z.infer<
  typeof hackathonMessageSendInputSchema
>;
