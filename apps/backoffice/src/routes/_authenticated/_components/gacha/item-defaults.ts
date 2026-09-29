import type { TClientInputs } from '@imphnen-frontend-service/service/rpc';

type TGachaItemCreateInput = TClientInputs['gacha']['item']['create'];

const CODE_SEPARATOR = '-';

export const GACHA_ITEM_DEFAULT = {
  RARITY: 'common',
  TYPE: 'physical',
  CATEGORY: 'merchandise',
  WEIGHT: 1,
  STOCK: 1,
} as const;

export const gachaItemCodeOf = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, CODE_SEPARATOR);

export const newGachaItemInput = (input: {
  name: string;
  stock: number;
  weight: number;
}): TGachaItemCreateInput => ({
  code: gachaItemCodeOf(input.name),
  name: input.name.trim(),
  rarity: GACHA_ITEM_DEFAULT.RARITY,
  type: GACHA_ITEM_DEFAULT.TYPE,
  category: GACHA_ITEM_DEFAULT.CATEGORY,
  weight: input.weight,
  stock: input.stock,
});
