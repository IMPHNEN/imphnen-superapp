import { z } from 'zod';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

export const GACHA_ITEM_LIMIT = {
  CODE_MAX: 100,
  NAME_MAX: 200,
  DESCRIPTION_MAX: 2000,
  LABEL_MAX: 50,
  WEIGHT_MAX: 1_000_000,
  STOCK_MAX: 1_000_000,
  VALUE_MAX: 1_000_000_000,
} as const;

export const GACHA_ITEM_DESCRIPTION_EMPTY = '';

export const gachaItemIdSchema = z.uuid();

export const gachaMetadataSchema = z.json().nullable();
export type TGachaMetadata = z.infer<typeof gachaMetadataSchema>;

const labelSchema = z.string().trim().min(1).max(GACHA_ITEM_LIMIT.LABEL_MAX);

export const gachaItemSchema = baseSchema(gachaItemIdSchema).extend({
  code: z.string(),
  name: z.string(),
  description: z.string(),
  rarity: z.string(),
  type: z.string(),
  category: z.string(),
  value: z.number().int(),
  weight: z.number().min(0),
  stock: z.number().int().min(0),
  isLimited: z.boolean(),
  metadata: gachaMetadataSchema,
});
export type TGachaItem = TEntityOf<z.infer<typeof gachaItemSchema>>;

const gachaItemFields = {
  code: z.string().trim().min(1).max(GACHA_ITEM_LIMIT.CODE_MAX),
  name: z.string().trim().min(1).max(GACHA_ITEM_LIMIT.NAME_MAX),
  description: z.string().max(GACHA_ITEM_LIMIT.DESCRIPTION_MAX),
  rarity: labelSchema,
  type: labelSchema,
  category: labelSchema,
  value: z.number().int().min(0).max(GACHA_ITEM_LIMIT.VALUE_MAX),
  weight: z.number().min(0).max(GACHA_ITEM_LIMIT.WEIGHT_MAX),
  stock: z.number().int().min(0).max(GACHA_ITEM_LIMIT.STOCK_MAX),
  isLimited: z.boolean(),
  metadata: gachaMetadataSchema,
};

export const gachaItemCreateInputSchema = z.object({
  ...gachaItemFields,
  description: gachaItemFields.description.default(
    GACHA_ITEM_DESCRIPTION_EMPTY
  ),
  value: gachaItemFields.value.default(0),
  isLimited: gachaItemFields.isLimited.default(false),
  metadata: gachaItemFields.metadata.default(null),
});
export type TGachaItemCreateInput = z.infer<typeof gachaItemCreateInputSchema>;

export const gachaItemUpdateInputSchema = z
  .object(gachaItemFields)
  .partial()
  .extend({ id: gachaItemIdSchema });
export type TGachaItemUpdateInput = z.infer<typeof gachaItemUpdateInputSchema>;

export const gachaItemIdInputSchema = z.object({ id: gachaItemIdSchema });
export type TGachaItemIdInput = z.infer<typeof gachaItemIdInputSchema>;

export const GACHA_ITEM_SORT = {
  NAME: 'name',
  CODE: 'code',
  STOCK: 'stock',
  WEIGHT: 'weight',
  CREATED_AT: 'createdAt',
} as const;

export type TGachaItemSort =
  (typeof GACHA_ITEM_SORT)[keyof typeof GACHA_ITEM_SORT];

export const gachaItemListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  sortBy: z
    .enum([
      GACHA_ITEM_SORT.NAME,
      GACHA_ITEM_SORT.CODE,
      GACHA_ITEM_SORT.STOCK,
      GACHA_ITEM_SORT.WEIGHT,
      GACHA_ITEM_SORT.CREATED_AT,
    ])
    .default(GACHA_ITEM_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TGachaItemListInput = z.infer<typeof gachaItemListInputSchema>;

export const gachaItemListSchema = paginated(gachaItemSchema);
export type TGachaItemList = z.infer<typeof gachaItemListSchema>;
