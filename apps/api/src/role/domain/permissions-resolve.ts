import {
  isPermission,
  isRole,
  permissionsForRole,
  type TPermission,
} from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import type { EDatabase } from '#/shared/errors.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';

type TPermissionsEffect = Effect.Effect<
  readonly TPermission[],
  EDatabase,
  TCustomRoleRepoId
>;

export const permissionsResolve = (role: string): TPermissionsEffect =>
  match(role)
    .when(
      isRole,
      (fixed): TPermissionsEffect => Effect.succeed(permissionsForRole(fixed))
    )
    .otherwise(
      (key): TPermissionsEffect =>
        CustomRoleRepo.use((repo) => repo.findByKey(key)).pipe(
          Effect.map((custom) =>
            custom === null ? [] : A.filter(custom.permissions, isPermission)
          )
        )
    );
