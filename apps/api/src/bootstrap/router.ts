import { activityModule } from '#/activity/index.ts';
import { authModule } from '#/auth/index.ts';
import { healthModule } from '#/health/index.ts';
import { permissionModule } from '#/permission/index.ts';
import { roleModule } from '#/role/index.ts';
import { userModule } from '#/user/index.ts';
import { implementer } from '#/platform/orpc/implementer.ts';

const appRouter = implementer.router({
  health: healthModule.routerBuild(),
  me: authModule.routerBuild(),
  user: userModule.routerBuild(),
  role: roleModule.routerBuild(),
  permission: permissionModule.routerBuild(),
  activity: activityModule.routerBuild(),
});

export type TAppRouter = typeof appRouter;

export const routerBuild = (): TAppRouter => appRouter;
