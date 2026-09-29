import { gachaItemSchema, type TGachaItem } from '@app/schemas';
import type { TGachaItemRow } from '#/gacha/domain/gacha-item.ts';

export const toGachaItemDto = (row: TGachaItemRow): TGachaItem =>
  gachaItemSchema.parse({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    rarity: row.rarity,
    type: row.type,
    category: row.category,
    value: row.value,
    weight: row.weight,
    stock: row.stock,
    isLimited: row.isLimited,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
