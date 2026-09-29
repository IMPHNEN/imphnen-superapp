import { PERMISSION } from '@app/permissions';
import { userActiveSet } from '#/user/application/user-active-set.ts';
import { userCreate } from '#/user/application/user-create.ts';
import { userDelete } from '#/user/application/user-delete.ts';
import { userGet } from '#/user/application/user-get.ts';
import { userList } from '#/user/application/user-list.ts';
import { userPasswordReset } from '#/user/application/user-password-reset.ts';
import { userUpdate } from '#/user/application/user-update.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';
import { effectRun } from '#/platform/orpc/run-effect.ts';

const userRouter = implementer.user.router({
  list: permissionGuarded(PERMISSION.USER_READ).user.list.handler(
    ({ input, context }) => effectRun(context.runtime, userList(input))
  ),

  get: permissionGuarded(PERMISSION.USER_READ).user.get.handler(
    ({ input, context }) => effectRun(context.runtime, userGet(input))
  ),

  create: permissionGuarded(PERMISSION.USER_CREATE).user.create.handler(
    ({ input, context }) =>
      effectRun(context.runtime, userCreate(input, context.session.user.id))
  ),

  update: permissionGuarded(PERMISSION.USER_UPDATE).user.update.handler(
    ({ input, context }) =>
      effectRun(context.runtime, userUpdate(input, context.session.user.id))
  ),

  setActive: permissionGuarded(PERMISSION.USER_ACTIVATE).user.setActive.handler(
    ({ input, context }) =>
      effectRun(context.runtime, userActiveSet(input, context.session.user.id))
  ),

  remove: permissionGuarded(PERMISSION.USER_DELETE).user.remove.handler(
    ({ input, context }) =>
      effectRun(context.runtime, userDelete(input, context.session.user.id))
  ),

  resetPassword: permissionGuarded(
    PERMISSION.USER_UPDATE
  ).user.resetPassword.handler(({ input, context }) =>
    effectRun(
      context.runtime,
      userPasswordReset(input, context.session.user.id)
    )
  ),
});

export type TUserRouter = typeof userRouter;

export const userRouterBuild = (): TUserRouter => userRouter;
