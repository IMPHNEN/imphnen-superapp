import { z } from 'zod';
import { baseSchema } from '../shared/base-schema.ts';
import { hackathonIdSchema } from './common.ts';
import { HACKATHON_LIMIT } from './constants.ts';

export const hackathonWinnerSchema = baseSchema(hackathonIdSchema).extend({
  rank: z.number().int().min(1),
  prize: z.string().nullable(),
  announcedAt: z.iso.datetime(),
  team: z.object({
    id: hackathonIdSchema,
    name: z.string(),
    city: z.string(),
    logoUrl: z.string().nullable(),
  }),
  projectName: z.string().nullable(),
});
export type THackathonWinner = z.infer<typeof hackathonWinnerSchema>;

export const hackathonWinnerListSchema = z.object({
  items: z.array(hackathonWinnerSchema).readonly(),
});
export type THackathonWinnerList = z.infer<typeof hackathonWinnerListSchema>;

export const hackathonWinnerSetInputSchema = z.object({
  teamId: hackathonIdSchema,
  rank: z.number().int().min(1),
  prize: z.string().trim().max(HACKATHON_LIMIT.PRIZE_MAX).nullish(),
});
export type THackathonWinnerSetInput = z.infer<
  typeof hackathonWinnerSetInputSchema
>;
