import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';

export const GACHA_CREDIT_GRANT_MAX = 1000;

export const gachaCreditSchema = z.object({
  userId: userIdSchema,
  balance: z.number().int().min(0),
  updatedAt: z.iso.datetime().nullable(),
});
export type TGachaCredit = z.infer<typeof gachaCreditSchema>;

export const gachaCreditGrantInputSchema = z.object({
  userId: userIdSchema,
  amount: z.number().int().min(1).max(GACHA_CREDIT_GRANT_MAX),
});
export type TGachaCreditGrantInput = z.infer<
  typeof gachaCreditGrantInputSchema
>;
