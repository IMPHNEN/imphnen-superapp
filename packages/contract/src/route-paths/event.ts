const EVENT_RESOURCE = '/events';

export const EVENT_ROUTE_PATH = {
  EVENTS: EVENT_RESOURCE,
  EVENT: `${EVENT_RESOURCE}/{id}`,
} as const;
