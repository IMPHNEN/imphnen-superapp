import { appContract } from '@app/contract';
import type { TPermission } from '@app/permissions';
import { implement } from '@orpc/server';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import {
  errorMapped,
  permissionRequire,
  sessionRequired,
} from '#/platform/orpc/middleware.ts';

export const implementer = implement(appContract)
  .$context<TORPCContext>()
  .use(errorMapped);

export const sessionGuarded = implementer.use(sessionRequired);

type TGuardedImplementer = typeof sessionGuarded;

export const permissionGuarded = (
  ...required: TPermission[]
): TGuardedImplementer => implementer.use(permissionRequire(...required));
