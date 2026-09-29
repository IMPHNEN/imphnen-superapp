import { PERMISSION } from '@app/permissions';
import { permissionList } from '#/permission/application/permission-list.ts';
import { implementer, permissionGuarded } from '#/platform/orpc/implementer.ts';

const permissionRouter = implementer.permission.router({
  list: permissionGuarded(PERMISSION.ROLE_READ).permission.list.handler(() =>
    permissionList()
  ),
});

export type TPermissionRouter = typeof permissionRouter;

export const permissionRouterBuild = (): TPermissionRouter => permissionRouter;
