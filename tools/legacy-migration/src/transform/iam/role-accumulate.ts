import type { TPermission } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import type { TLegacyRole } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type { TAdjustment, TReject } from '../../pipeline/step-types.ts';
import { jsonText } from '../../shared/json-text.ts';
import { adjustmentOf } from '../../shared/step-output.ts';
import type { TCustomRoleRow } from '../../target/target-rows.ts';

export type TRoleTransform = {
  readonly customRoles: readonly TCustomRoleRow[];
  readonly roleKeyById: ReadonlyMap<string, string>;
  readonly rejects: readonly TReject[];
  readonly adjustments: readonly TAdjustment[];
};

export const customRow = (
  role: TLegacyRole,
  key: string,
  label: string,
  description: string | null,
  permissions: readonly TPermission[]
): TCustomRoleRow => ({
  id: role.id,
  key,
  label,
  description,
  permissions: jsonText(permissions),
  created_by: null,
  created_at: role.created_at,
  updated_at: role.updated_at,
});

const withKey = (
  acc: TRoleTransform,
  role: TLegacyRole,
  key: string
): ReadonlyMap<string, string> => new Map([...acc.roleKeyById, [role.id, key]]);

export const takenKeys = (acc: TRoleTransform): ReadonlySet<string> =>
  new Set(A.map(acc.customRoles, (row): string => row.key));

export const fixedRole = (
  acc: TRoleTransform,
  role: TLegacyRole,
  key: string,
  why: string
): TRoleTransform => ({
  ...acc,
  roleKeyById: withKey(acc, role, key),
  adjustments: A.append(
    acc.adjustments,
    adjustmentOf(
      LEGACY_TABLE.APP_ROLES,
      role.id,
      ADJUSTMENT_RULE.ROLE_FIXED,
      `${role.name} -> ${key} (${why})`
    )
  ),
});

export const customRole = (
  acc: TRoleTransform,
  role: TLegacyRole,
  row: TCustomRoleRow
): TRoleTransform => ({
  ...acc,
  customRoles: A.append(acc.customRoles, row),
  roleKeyById: withKey(acc, role, row.key),
  adjustments: A.append(
    acc.adjustments,
    adjustmentOf(
      LEGACY_TABLE.APP_ROLES,
      role.id,
      ADJUSTMENT_RULE.ROLE_CUSTOM,
      `${role.name} -> ${row.key}`
    )
  ),
});
