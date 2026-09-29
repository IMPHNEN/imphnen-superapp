import {
  AuthService,
  authServiceLayer,
} from '#/auth/infrastructure/auth-service.ts';
import type { TAuthServiceId } from '#/auth/infrastructure/auth-service.ts';
import { meRouterBuild } from '#/auth/presentation/me-router.ts';
import { authMount } from '#/auth/presentation/mount-auth.ts';
import { AUTH_PROVIDER } from '#/auth/domain/auth-provider.ts';

export { AUTH_PROVIDER, AuthService, authMount };
export type { TAuthServiceId };

export const authModule: {
  layer: typeof authServiceLayer;
  routerBuild: typeof meRouterBuild;
} = {
  layer: authServiceLayer,
  routerBuild: meRouterBuild,
};
