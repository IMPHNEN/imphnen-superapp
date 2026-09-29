import {
  eventCreateInputSchema,
  eventIdInputSchema,
  eventListInputSchema,
  eventListSchema,
  eventItemSchema,
  eventUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const eventContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.EVENTS })
    .input(eventListInputSchema)
    .output(eventListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.EVENT })
    .input(eventIdInputSchema)
    .output(eventItemSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.EVENTS })
    .input(eventCreateInputSchema)
    .output(eventItemSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.EVENT })
    .input(eventUpdateInputSchema)
    .output(eventItemSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.EVENT })
    .input(eventIdInputSchema)
    .output(eventIdInputSchema),
};
