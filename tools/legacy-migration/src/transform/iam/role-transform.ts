import { ROLE } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TLegacyRole } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type { TAdjustment } from '../../pipeline/step-types.ts';
import { adjustmentOf, rejectOf } from '../../shared/step-output.ts';
import { cut, emptyToNull } from '../../shared/text.ts';
import {
  permissionsResolve,
  storedPermissionsOf,
} from './permission-resolve.ts';
import {
  customRole,
  customRow,
  fixedRole,
  type TRoleTransform,
  takenKeys,
} from './role-accumulate.ts';
import { roleKeyOf } from './role-key.ts';
import {
  NAMED_FIXED_ROLES,
  SEEDED_ROLE_KIND,
  SEEDED_ROLES,
  type TSeededRole,
} from './seeded-role.ts';

const LABEL_MAX = 100;
const DESCRIPTION_MAX = 500;

const EMPTY: TRoleTransform = {
  customRoles: [],
  roleKeyById: new Map(),
  rejects: [],
  adjustments: [],
};

const seededStep = (
  acc: TRoleTransform,
  role: TLegacyRole,
  seeded: TSeededRole
): TRoleTransform =>
  match(seeded)
    .with(
      { kind: SEEDED_ROLE_KIND.FIXED },
      (value): TRoleTransform => fixedRole(acc, role, value.role, 'seeded')
    )
    .with(
      { kind: SEEDED_ROLE_KIND.CUSTOM },
      (value): TRoleTransform =>
        customRole(
          acc,
          role,
          customRow(role, value.key, value.label, null, value.permissions)
        )
    )
    .exhaustive();

const apiRoleStep = (
  acc: TRoleTransform,
  role: TLegacyRole
): TRoleTransform => {
  const resolution = permissionsResolve(storedPermissionsOf(role.permissions));
  const unmapped = A.map(
    resolution.unmapped,
    (value): TAdjustment =>
      adjustmentOf(
        LEGACY_TABLE.APP_ROLES,
        role.id,
        ADJUSTMENT_RULE.PERMISSION_UNMAPPED,
        value
      )
  );
  const next = { ...acc, adjustments: A.concat(acc.adjustments, unmapped) };
  const named = NAMED_FIXED_ROLES.get(role.name);
  return match({ administrator: resolution.administrator, named })
    .with(
      { administrator: true },
      (): TRoleTransform =>
        fixedRole(next, role, ROLE.ADMIN, 'holds Administrator')
    )
    .with(
      { named: P.string },
      (value): TRoleTransform => fixedRole(next, role, value.named, 'name')
    )
    .otherwise(
      (): TRoleTransform =>
        customRole(
          next,
          role,
          customRow(
            role,
            roleKeyOf(role.name, takenKeys(next)),
            cut(role.name.trim(), LABEL_MAX),
            emptyToNull(
              role.description === null
                ? null
                : cut(role.description, DESCRIPTION_MAX)
            ),
            resolution.keys
          )
        )
    );
};

const roleStep = (acc: TRoleTransform, role: TLegacyRole): TRoleTransform =>
  match({
    deleted: role.deleted_at !== null,
    seeded: SEEDED_ROLES.get(role.id),
  })
    .with(
      { deleted: true },
      (): TRoleTransform => ({
        ...acc,
        rejects: A.append(
          acc.rejects,
          rejectOf(
            LEGACY_TABLE.APP_ROLES,
            role.id,
            REJECT_REASON.ROLE_DELETED,
            role.name
          )
        ),
      })
    )
    .with(
      { seeded: P.not(P.nullish) },
      (value): TRoleTransform => seededStep(acc, role, value.seeded)
    )
    .otherwise((): TRoleTransform => apiRoleStep(acc, role));

const processingOrder = (
  roles: readonly TLegacyRole[]
): readonly TLegacyRole[] =>
  A.concat(
    A.filter(roles, (role): boolean => SEEDED_ROLES.has(role.id)),
    A.sort(
      A.filter(roles, (role): boolean => !SEEDED_ROLES.has(role.id)),
      (left, right): number =>
        left.created_at - right.created_at || left.id.localeCompare(right.id)
    )
  );

export const rolesTransform = (roles: readonly TLegacyRole[]): TRoleTransform =>
  A.reduce(processingOrder(roles), EMPTY, roleStep);
