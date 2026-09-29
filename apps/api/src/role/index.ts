import { roleEnsure, roleExists } from '#/role/application/role-ensure.ts';
import { CustomRoleRepo } from '#/role/domain/custom-role.ts';
import type { TCustomRoleRepoId } from '#/role/domain/custom-role.ts';
import { permissionsResolve } from '#/role/domain/permissions-resolve.ts';
import { customRoleRepoLayer } from '#/role/infrastructure/custom-role-repository.ts';
import { roleRouterBuild } from '#/role/presentation/role-router.ts';

export { CustomRoleRepo, permissionsResolve, roleEnsure, roleExists };
export type { TCustomRoleRepoId };

export const roleModule: {
  layer: typeof customRoleRepoLayer;
  routerBuild: typeof roleRouterBuild;
} = {
  layer: customRoleRepoLayer,
  routerBuild: roleRouterBuild,
};
