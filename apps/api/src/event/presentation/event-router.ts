import { PERMISSION } from '@app/permissions';
import { eventCreate } from '#/event/application/event-create.ts';
import { eventDelete } from '#/event/application/event-delete.ts';
import { eventGet } from '#/event/application/event-get.ts';
import { eventList } from '#/event/application/event-list.ts';
import { eventUpdate } from '#/event/application/event-update.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const eventRouter = implementer.event.router({
  list: implementer.event.list.handler(({ input, context }) =>
    effectRun(context.runtime, eventList(input))
  ),

  get: implementer.event.get.handler(({ input, context }) =>
    effectRun(context.runtime, eventGet(input))
  ),

  create: permissionGuarded(PERMISSION.EVENT_CREATE).event.create.handler(
    ({ input, context }) =>
      effectRun(context.runtime, eventCreate(input, context.session.user.id))
  ),

  update: permissionGuarded(PERMISSION.EVENT_UPDATE).event.update.handler(
    ({ input, context }) =>
      effectRun(context.runtime, eventUpdate(input, context.session.user.id))
  ),

  remove: permissionGuarded(PERMISSION.EVENT_DELETE).event.remove.handler(
    ({ input, context }) =>
      effectRun(context.runtime, eventDelete(input, context.session.user.id))
  ),
});

export type TEventRouter = typeof eventRouter;

export const eventRouterBuild = (): TEventRouter => eventRouter;
