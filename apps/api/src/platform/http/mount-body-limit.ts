import type { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';

export const REQUEST_BODY_MAX_BYTES = 10_485_760;

export const bodyLimitMount = (app: Hono): void => {
  app.use('*', bodyLimit({ maxSize: REQUEST_BODY_MAX_BYTES }));
};
