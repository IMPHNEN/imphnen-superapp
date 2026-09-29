import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const ROADMAP_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.ROADMAP_ITEM_CREATE]: 'Roadmap item created',
  [ACTIVITY_ACTION.ROADMAP_ITEM_UPDATE]: 'Roadmap item updated',
  [ACTIVITY_ACTION.ROADMAP_ITEM_DELETE]: 'Roadmap item deleted',
} as const;

export const ROADMAP_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.ROADMAP_ITEM]: 'Roadmap item',
} as const;
