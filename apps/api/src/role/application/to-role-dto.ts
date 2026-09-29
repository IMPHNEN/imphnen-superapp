import { ROLE_DESCRIPTION, ROLE_LABEL } from '@app/messages';
import { isPermission, permissionsForRole, type TRole } from '@app/permissions';
import { roleSchema, type TRoleDto } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import type {
  TCustomRoleRow,
  TRoleMemberCounts,
} from '#/role/domain/custom-role.ts';

export const fixedRoleDto = (key: TRole, counts: TRoleMemberCounts): TRoleDto =>
  roleSchema.parse({
    key,
    label: ROLE_LABEL[key],
    description: ROLE_DESCRIPTION[key],
    permissions: permissionsForRole(key),
    fixed: true,
    memberCount: D.get(counts, key) ?? 0,
  });

export const toRoleDto = (
  row: TCustomRoleRow,
  counts: TRoleMemberCounts
): TRoleDto =>
  roleSchema.parse({
    key: row.key,
    label: row.label,
    description: row.description,
    permissions: A.filter(row.permissions, isPermission),
    fixed: false,
    memberCount: D.get(counts, row.key) ?? 0,
  });
