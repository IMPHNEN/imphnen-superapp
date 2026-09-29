import {
  userActiveInputSchema,
  userCreateInputSchema,
  userIdInputSchema,
  userListInputSchema,
  userListSchema,
  userPasswordResetInputSchema,
  userSchema,
  userUpdateInputSchema,
} from '@app/schemas';
import { oc } from '@orpc/contract';
import { z } from 'zod';
import { HTTP_METHOD } from './http-methods.ts';
import { ROUTE_PATH } from './route-paths.ts';

export const userContract = {
  list: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.USERS })
    .input(userListInputSchema)
    .output(userListSchema),

  get: oc
    .route({ method: HTTP_METHOD.GET, path: ROUTE_PATH.USER })
    .input(userIdInputSchema)
    .output(userSchema),

  create: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.USERS })
    .input(userCreateInputSchema)
    .output(userSchema),

  update: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.USER })
    .input(userUpdateInputSchema)
    .output(userSchema),

  setActive: oc
    .route({ method: HTTP_METHOD.PATCH, path: ROUTE_PATH.USER_ACTIVE })
    .input(userActiveInputSchema)
    .output(userSchema),

  remove: oc
    .route({ method: HTTP_METHOD.DELETE, path: ROUTE_PATH.USER })
    .input(userIdInputSchema)
    .output(z.object({ id: z.uuid() })),

  resetPassword: oc
    .route({ method: HTTP_METHOD.POST, path: ROUTE_PATH.USER_PASSWORD })
    .input(userPasswordResetInputSchema)
    .output(z.object({ id: z.uuid() })),
};
