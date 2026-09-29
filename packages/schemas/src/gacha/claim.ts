import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { gachaItemIdSchema } from './item.ts';

export const GACHA_CLAIM_STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
} as const;

export type TGachaClaimStatus =
  (typeof GACHA_CLAIM_STATUS)[keyof typeof GACHA_CLAIM_STATUS];

export const gachaClaimStatusSchema = z.enum([
  GACHA_CLAIM_STATUS.PENDING,
  GACHA_CLAIM_STATUS.FULFILLED,
]);

export const GACHA_CLAIM_SOURCE = {
  ROLL: 'roll',
  GRANT: 'grant',
} as const;

export type TGachaClaimSource =
  (typeof GACHA_CLAIM_SOURCE)[keyof typeof GACHA_CLAIM_SOURCE];

export const gachaClaimIdSchema = z.uuid();

export const gachaClaimItemSchema = z.object({
  id: gachaItemIdSchema,
  code: z.string(),
  name: z.string(),
});

export const gachaClaimUserSchema = z.object({
  id: userIdSchema,
  name: z.string(),
  email: z.email(),
});

export const gachaClaimSchema = baseSchema(gachaClaimIdSchema).extend({
  item: gachaClaimItemSchema,
  source: z.enum([GACHA_CLAIM_SOURCE.ROLL, GACHA_CLAIM_SOURCE.GRANT]),
  status: gachaClaimStatusSchema,
  quantity: z.number().int().min(1),
  fulfilledAt: z.iso.datetime().nullable(),
});
export type TGachaClaim = TEntityOf<z.infer<typeof gachaClaimSchema>>;

export const gachaClaimAdminSchema = gachaClaimSchema.extend({
  user: gachaClaimUserSchema,
  fulfilledBy: userIdSchema.nullable(),
});
export type TGachaClaimAdmin = TEntityOf<z.infer<typeof gachaClaimAdminSchema>>;

export const gachaClaimMineInputSchema = paginationSchema.extend({
  status: gachaClaimStatusSchema.optional(),
});
export type TGachaClaimMineInput = z.infer<typeof gachaClaimMineInputSchema>;

export const gachaClaimListInputSchema = gachaClaimMineInputSchema.extend({
  search: searchQuerySchema.optional(),
  userId: userIdSchema.optional(),
});
export type TGachaClaimListInput = z.infer<typeof gachaClaimListInputSchema>;

export const gachaClaimIdInputSchema = z.object({ id: gachaClaimIdSchema });
export type TGachaClaimIdInput = z.infer<typeof gachaClaimIdInputSchema>;

export const gachaClaimMineListSchema = paginated(gachaClaimSchema);
export type TGachaClaimMineList = z.infer<typeof gachaClaimMineListSchema>;

export const gachaClaimListSchema = paginated(gachaClaimAdminSchema);
export type TGachaClaimList = z.infer<typeof gachaClaimListSchema>;
