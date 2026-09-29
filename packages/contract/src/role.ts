import {
  roleCreateInputSchema,
  roleKeyInputSchema,
  roleListSchema,
  roleSchema,
  roleUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const roleContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROLES })
    .output(roleListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.ROLE })
    .input(roleKeyInputSchema)
    .output(roleSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.ROLES })
    .input(roleCreateInputSchema)
    .output(roleSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.ROLE })
    .input(roleUpdateInputSchema)
    .output(roleSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.ROLE })
    .input(roleKeyInputSchema)
    .output(z.object({ key: z.string() })),
};
