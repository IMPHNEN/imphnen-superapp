import type { ContractRouterClient } from '@orpc/contract';
import { activityContract } from './activity.ts';
import { healthContract } from './health.ts';
import { meContract } from './me.ts';
import { permissionContract } from './permission.ts';
import { roleContract } from './role.ts';
import { userContract } from './user.ts';

export { HTTP_METHOD, type THttpMethod } from './http-methods.ts';
export { ROUTE_PATH, type TRoutePath } from './route-paths.ts';

export const appContract = {
  health: healthContract,
  me: meContract,
  user: userContract,
  role: roleContract,
  permission: permissionContract,
  activity: activityContract,
};

export type TAppContract = typeof appContract;

export type TAppRouterClient = ContractRouterClient<TAppContract>;
