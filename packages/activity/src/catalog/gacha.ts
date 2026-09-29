export const GACHA_ACTIVITY_RESOURCE_TYPE = {
  GACHA_ITEM: 'gacha-item',
  GACHA_CREDIT: 'gacha-credit',
  GACHA_CLAIM: 'gacha-claim',
} as const;

export const GACHA_ACTIVITY_ACTION = {
  GACHA_ITEM_CREATE: 'gacha.item.create',
  GACHA_ITEM_UPDATE: 'gacha.item.update',
  GACHA_ITEM_DELETE: 'gacha.item.delete',
  GACHA_CREDIT_GRANT: 'gacha.credit.grant',
  GACHA_CLAIM_FULFIL: 'gacha.claim.fulfil',
} as const;
