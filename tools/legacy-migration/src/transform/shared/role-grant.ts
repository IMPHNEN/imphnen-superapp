import {
  ROLE,
  ROLE_PERMISSIONS,
  type TPermission,
  type TRole,
} from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TLegacyTable } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type { TStepOutput } from '../../pipeline/step-types.ts';
import { jsonText } from '../../shared/json-text.ts';
import { stableUuid } from '../../shared/stable-uuid.ts';
import {
  adjustmentOf,
  insertedRows,
  outputOf,
  outputsMerge,
} from '../../shared/step-output.ts';
import type { TCustomRoleRow, TUserRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { catalogOrdered } from '../iam/permission-resolve.ts';

const CUSTOM_ROLE_NAMESPACE = 'custom-role|';

export type TGrantRole = { readonly key: string; readonly label: string };

export type TAdminGrant = {
  readonly table: TLegacyTable;
  readonly why: string;
  readonly permissions: readonly TPermission[];
  readonly forUser: TGrantRole;
  readonly forMentor: TGrantRole;
};

export type TGrantee = { readonly legacyId: string; readonly userId: string };

export const roleChange = (
  table: TLegacyTable,
  user: TUserRow,
  role: string,
  why: string
): TStepOutput =>
  outputOf({
    patches: [{ table: TARGET_TABLE.USER, key: user.id, set: { role } }],
    adjustments: [
      adjustmentOf(
        table,
        user.id,
        ADJUSTMENT_RULE.USER_ROLE_CHANGED,
        `${user.role} -> ${role} (${why})`
      ),
    ],
  });

const customRoleOf = (
  role: TGrantRole,
  base: TRole,
  extra: readonly TPermission[],
  now: number
): TCustomRoleRow => ({
  id: stableUuid(`${CUSTOM_ROLE_NAMESPACE}${role.key}`),
  key: role.key,
  label: role.label,
  description: null,
  permissions: jsonText(
    catalogOrdered(A.concat(ROLE_PERMISSIONS[base], extra))
  ),
  created_by: null,
  created_at: now,
  updated_at: now,
});

const granteeOutput = (
  grant: TAdminGrant,
  grantee: TGrantee,
  user: TUserRow | undefined
): TStepOutput =>
  match(user)
    .with(
      P.nullish,
      (): TStepOutput =>
        outputOf({
          adjustments: [
            adjustmentOf(
              grant.table,
              grantee.legacyId,
              ADJUSTMENT_RULE.ROLE_GRANT_MANUAL,
              `${grant.why}: user ${grantee.userId} not migrated`
            ),
          ],
        })
    )
    .with(
      { role: P.union(ROLE.SUPERADMIN, ROLE.ADMIN) },
      (): TStepOutput => outputOf({})
    )
    .with(
      { role: P.union(ROLE.USER, grant.forUser.key) },
      (found): TStepOutput =>
        found.role === grant.forUser.key
          ? outputOf({})
          : roleChange(grant.table, found, grant.forUser.key, grant.why)
    )
    .with(
      { role: P.union(ROLE.MENTOR, grant.forMentor.key) },
      (found): TStepOutput =>
        found.role === grant.forMentor.key
          ? outputOf({})
          : roleChange(grant.table, found, grant.forMentor.key, grant.why)
    )
    .otherwise(
      (found): TStepOutput =>
        outputOf({
          adjustments: [
            adjustmentOf(
              grant.table,
              grantee.legacyId,
              ADJUSTMENT_RULE.ROLE_GRANT_MANUAL,
              `${grant.why}: user ${found.id} holds custom role ${found.role}`
            ),
          ],
        })
    );

const roleRowsNeeded = (
  grant: TAdminGrant,
  changes: TStepOutput,
  existingKeys: ReadonlySet<string>,
  now: number
): readonly TCustomRoleRow[] => {
  const used = new Set(
    A.map(changes.patches, (patch): string => String(patch.set.role))
  );
  return A.filter(
    [
      customRoleOf(grant.forUser, ROLE.USER, grant.permissions, now),
      customRoleOf(grant.forMentor, ROLE.MENTOR, grant.permissions, now),
    ],
    (row): boolean => used.has(row.key) && !existingKeys.has(row.key)
  );
};

export const adminGrant = (
  grant: TAdminGrant,
  grantees: readonly TGrantee[],
  users: ReadonlyMap<string, TUserRow>,
  existingRoles: readonly TCustomRoleRow[],
  now: number
): TStepOutput => {
  const unique = A.uniqBy(grantees, (grantee): string => grantee.userId);
  const changes = outputsMerge(
    A.map(
      unique,
      (grantee): TStepOutput =>
        granteeOutput(grant, grantee, users.get(grantee.userId))
    )
  );
  const existingKeys = new Set(A.map(existingRoles, (row): string => row.key));
  return outputsMerge([
    outputOf({
      inserts: [
        {
          table: TARGET_TABLE.CUSTOM_ROLE,
          rows: roleRowsNeeded(grant, changes, existingKeys, now),
        },
      ],
    }),
    changes,
  ]);
};

export const customRolesOf = (output: TStepOutput): readonly TCustomRoleRow[] =>
  insertedRows(output, TARGET_TABLE.CUSTOM_ROLE) as readonly TCustomRoleRow[];
