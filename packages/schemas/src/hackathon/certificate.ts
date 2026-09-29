import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { hackathonIdSchema, hackathonTeamRefSchema } from './common.ts';

export const hackathonCertificateSchema = z.object({
  id: hackathonIdSchema,
  recipient: z.object({ id: userIdSchema, name: z.string() }),
  team: hackathonTeamRefSchema,
  isLeader: z.boolean(),
  project: z.object({
    name: z.string(),
    submittedAt: z.iso.datetime().nullable(),
  }),
  winner: z
    .object({ rank: z.number().int().min(1), prize: z.string().nullable() })
    .nullable(),
});
export type THackathonCertificate = z.infer<typeof hackathonCertificateSchema>;
