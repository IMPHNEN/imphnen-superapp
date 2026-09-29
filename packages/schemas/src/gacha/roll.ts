import { z } from 'zod';
import { gachaClaimSchema } from './claim.ts';

export const gachaRollResultSchema = z.object({
  claim: gachaClaimSchema,
  balance: z.number().int().min(0),
});
export type TGachaRollResult = z.infer<typeof gachaRollResultSchema>;
