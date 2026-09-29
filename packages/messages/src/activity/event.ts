import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const EVENT_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.EVENT_CREATE]: 'Event created',
  [ACTIVITY_ACTION.EVENT_UPDATE]: 'Event updated',
  [ACTIVITY_ACTION.EVENT_DELETE]: 'Event deleted',
} as const;

export const EVENT_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.EVENT]: 'Event',
} as const;
