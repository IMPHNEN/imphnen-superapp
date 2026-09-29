import {
  ACTIVITY_ACTION,
  ACTIVITY_RESOURCE_TYPE,
} from '@app/activity';

export const GACHA_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.GACHA_ITEM_CREATE]: 'Gacha item created',
  [ACTIVITY_ACTION.GACHA_ITEM_UPDATE]: 'Gacha item updated',
  [ACTIVITY_ACTION.GACHA_ITEM_DELETE]: 'Gacha item deleted',
  [ACTIVITY_ACTION.GACHA_CREDIT_GRANT]: 'Gacha credits granted',
  [ACTIVITY_ACTION.GACHA_CLAIM_FULFIL]: 'Gacha prize fulfilled',
} as const;

export const GACHA_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.GACHA_ITEM]: 'Gacha item',
  [ACTIVITY_RESOURCE_TYPE.GACHA_CREDIT]: 'Gacha credit',
  [ACTIVITY_RESOURCE_TYPE.GACHA_CLAIM]: 'Gacha prize',
} as const;
