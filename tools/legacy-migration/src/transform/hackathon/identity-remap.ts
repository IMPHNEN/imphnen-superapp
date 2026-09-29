import { ROLE } from '@app/permissions';
import { A, D } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TLegacyHackathonUser } from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TMigrationOptions,
} from '../../pipeline/step-types.ts';
import { adjustmentOf } from '../../shared/step-output.ts';
import type { TUserRow } from '../../target/target-rows.ts';
import { normaliseEmail } from '../iam/user-transform.ts';

const SQL_TRUE = 1;
const SQL_FALSE = 0;

export type TIdentity = {
  readonly uidOf: (legacyId: string) => string | null;
  readonly createdUsers: readonly TUserRow[];
  readonly representatives: ReadonlyMap<string, TLegacyHackathonUser>;
  readonly adjustments: readonly TAdjustment[];
};

export const updatedAtOf = (row: TLegacyHackathonUser): number =>
  row.updated_at ?? row.created_at ?? 0;

const latestOf = (
  rows: readonly TLegacyHackathonUser[]
): TLegacyHackathonUser =>
  A.reduce(
    rows,
    rows[0],
    (best, row): TLegacyHackathonUser =>
      updatedAtOf(row) > updatedAtOf(best) ? row : best
  );

const createdUserOf = (
  row: TLegacyHackathonUser,
  options: TMigrationOptions
): TUserRow => {
  const createdAt = row.created_at ?? options.now;
  return {
    id: row.id,
    name:
      row.fullname.trim() === ''
        ? normaliseEmail(row.email)
        : row.fullname.trim(),
    email: normaliseEmail(row.email),
    email_verified: SQL_FALSE,
    image: null,
    role: ROLE.USER,
    is_active: SQL_TRUE,
    deleted_at: null,
    created_at: createdAt,
    updated_at: row.updated_at ?? createdAt,
  };
};

type TGroupResolution = {
  readonly userId: string;
  readonly created: TUserRow | null;
};

const resolveGroup = (
  rows: readonly TLegacyHackathonUser[],
  byEmail: ReadonlyMap<string, TUserRow>,
  platformIds: ReadonlySet<string>,
  options: TMigrationOptions
): TGroupResolution => {
  const byMail = byEmail.get(normaliseEmail(rows[0].email));
  const byId = A.find(rows, (row): boolean => platformIds.has(row.id));
  const latest = latestOf(rows);
  return match({ byMail, byId })
    .with(
      { byMail: P.not(P.nullish) },
      (found): TGroupResolution => ({
        userId: found.byMail.id,
        created: null,
      })
    )
    .with(
      { byId: P.not(P.nullish) },
      (found): TGroupResolution => ({
        userId: found.byId.id,
        created: null,
      })
    )
    .otherwise(
      (): TGroupResolution => ({
        userId: latest.id,
        created: createdUserOf(latest, options),
      })
    );
};

type TResolvedGroup = {
  readonly rows: readonly TLegacyHackathonUser[];
  readonly resolution: TGroupResolution;
};

export const identityRemap = (
  hackathonUsers: readonly TLegacyHackathonUser[],
  platformUsers: readonly TUserRow[],
  options: TMigrationOptions
): TIdentity => {
  const byEmail = new Map(
    A.map(platformUsers, (user): [string, TUserRow] => [user.email, user])
  );
  const platformIds = new Set(A.map(platformUsers, (user): string => user.id));
  const groups = D.values(
    A.groupBy(hackathonUsers, (row): string => normaliseEmail(row.email))
  ) as readonly (readonly TLegacyHackathonUser[])[];
  const resolved = A.map(
    groups,
    (rows): TResolvedGroup => ({
      rows,
      resolution: resolveGroup(rows, byEmail, platformIds, options),
    })
  );
  const uidByLegacy = new Map(
    A.flat(
      A.map(resolved, (entry): readonly [string, string][] =>
        A.map(entry.rows, (row): [string, string] => [
          row.id,
          entry.resolution.userId,
        ])
      )
    )
  );
  const createdUsers = A.filterMap(
    resolved,
    (entry): TUserRow | undefined => entry.resolution.created ?? undefined
  );
  return {
    uidOf: (legacyId: string): string | null =>
      uidByLegacy.get(legacyId) ??
      (platformIds.has(legacyId) ? legacyId : null),
    createdUsers,
    representatives: new Map(
      A.map(resolved, (entry): [string, TLegacyHackathonUser] => [
        entry.resolution.userId,
        latestOf(entry.rows),
      ])
    ),
    adjustments: A.concat(
      A.map(
        createdUsers,
        (user): TAdjustment =>
          adjustmentOf(
            LEGACY_TABLE.HACKATHON_USERS,
            user.id,
            ADJUSTMENT_RULE.HACKATHON_USER_CREATED,
            `${user.email} has no platform account and no password`
          )
      ),
      A.filterMap(resolved, (entry): TAdjustment | undefined =>
        entry.rows.length > 1
          ? adjustmentOf(
              LEGACY_TABLE.HACKATHON_USERS,
              entry.resolution.userId,
              ADJUSTMENT_RULE.HACKATHON_USER_MERGED,
              A.join(
                A.map(entry.rows, (row): string => row.id),
                ', '
              )
            )
          : undefined
      )
    ),
  };
};
