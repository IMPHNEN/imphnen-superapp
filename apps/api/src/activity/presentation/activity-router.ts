import { PERMISSION } from '@app/permissions';
import { activityList } from '#/activity/application/activity-list.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const activityRouter = implementer.activity.router({
  list: permissionGuarded(PERMISSION.ACTIVITY_READ).activity.list.handler(
    ({ input, context }) => effectRun(context.runtime, activityList(input))
  ),
});

export type TActivityRouter = typeof activityRouter;

export const activityRouterBuild = (): TActivityRouter => activityRouter;
