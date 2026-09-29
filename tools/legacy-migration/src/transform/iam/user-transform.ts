import { ROLE } from '@app/permissions';
import { A, D } from '@mobily/ts-belt';
import type { TLegacyUser } from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TMigrationOptions,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { stableUuid } from '../../shared/stable-uuid.ts';
import {
  adjustmentOf,
  blockingRejectOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type {
  TAccountRow,
  TUserProfileRow,
  TUserRow,
} from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { avatarPlan } from './avatar-file.ts';
import { profileMetadataParse } from './profile-metadata.ts';

const CREDENTIAL_PROVIDER = 'credential';
const ACCOUNT_NAMESPACE = 'account|';
const EMAIL_AT = '@';
const NAME_SEPARATOR = ' ';
const SQL_TRUE = 1;
const SQL_FALSE = 0;

export const normaliseEmail = (email: string): string =>
  email.trim().toLowerCase();

export const displayNameOf = (user: TLegacyUser): string => {
  const joined =
    `${user.first_name ?? ''}${NAME_SEPARATOR}${user.last_name ?? ''}`.trim();
  return joined === '' ? normaliseEmail(user.email).split(EMAIL_AT)[0] : joined;
};

const flag = (value: boolean): number => (value ? SQL_TRUE : SQL_FALSE);

const isActiveOf = (user: TLegacyUser): boolean =>
  user.deleted_at === null && !(user.is_verified && !user.is_active);

const accountOf = (user: TLegacyUser): readonly TAccountRow[] =>
  user.password_hash === null || user.password_hash === ''
    ? []
    : [
        {
          id: stableUuid(`${ACCOUNT_NAMESPACE}${user.id}`),
          account_id: user.id,
          provider_id: CREDENTIAL_PROVIDER,
          user_id: user.id,
          password: user.password_hash,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
      ];

const userOutput = (
  user: TLegacyUser,
  roleKeyById: ReadonlyMap<string, string>,
  options: TMigrationOptions
): TStepOutput => {
  const avatar = avatarPlan(user.id, user.avatar_url, options);
  const parsed = profileMetadataParse(user.metadata);
  const row: TUserRow = {
    id: user.id,
    name: displayNameOf(user),
    email: normaliseEmail(user.email),
    email_verified: flag(user.is_active || user.is_verified),
    image: avatar.image,
    role:
      (user.role_id === null ? undefined : roleKeyById.get(user.role_id)) ??
      ROLE.USER,
    is_active: flag(isActiveOf(user)),
    deleted_at: user.deleted_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
  const profile: TUserProfileRow = {
    user_id: user.id,
    avatar_key: avatar.avatarKey,
    ...parsed.metadata.text,
    skills: parsed.metadata.skills,
    experience: parsed.metadata.experience,
    education: parsed.metadata.education,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
  const account = accountOf(user);
  return outputOf({
    inserts: [
      { table: TARGET_TABLE.USER, rows: [row] },
      { table: TARGET_TABLE.ACCOUNT, rows: account },
      { table: TARGET_TABLE.USER_PROFILE, rows: [profile] },
    ],
    files: avatar.files,
    adjustments: A.concat(avatar.adjustments, [
      ...(parsed.problem === null
        ? []
        : [
            adjustmentOf(
              LEGACY_TABLE.APP_USERS,
              user.id,
              ADJUSTMENT_RULE.PROFILE_METADATA_INVALID,
              parsed.problem
            ),
          ]),
      ...(account.length === 0
        ? [
            adjustmentOf(
              LEGACY_TABLE.APP_USERS,
              user.id,
              ADJUSTMENT_RULE.ACCOUNT_SKIPPED,
              'empty password hash'
            ),
          ]
        : []),
      ...(user.is_verified && !user.is_active
        ? [
            adjustmentOf(
              LEGACY_TABLE.APP_USERS,
              user.id,
              ADJUSTMENT_RULE.USER_DISABLED,
              row.email
            ),
          ]
        : []),
    ]),
  });
};

const duplicateOutput = (group: readonly TLegacyUser[]): TStepOutput =>
  outputOf({
    rejects: A.map(
      group,
      (user): TReject =>
        blockingRejectOf(
          LEGACY_TABLE.APP_USERS,
          user.id,
          REJECT_REASON.DUPLICATE_EMAIL,
          `${normaliseEmail(user.email)} is shared by ${A.join(
            A.map(group, (other): string => other.id),
            ', '
          )}`
        )
    ),
  });

const invalidOutput = (user: TLegacyUser): TStepOutput =>
  outputOf({
    rejects: [
      rejectOf(
        LEGACY_TABLE.APP_USERS,
        user.id,
        REJECT_REASON.INVALID_EMAIL,
        JSON.stringify(user.email)
      ),
    ],
  });

export const usersTransform = (
  users: readonly TLegacyUser[],
  roleKeyById: ReadonlyMap<string, string>,
  options: TMigrationOptions
): TStepOutput => {
  const [valid, invalid] = A.partition(users, (user): boolean =>
    normaliseEmail(user.email).includes(EMAIL_AT)
  );
  const groups = D.values(
    A.groupBy(valid, (user): string => normaliseEmail(user.email))
  ) as readonly (readonly TLegacyUser[])[];
  return outputsMerge(
    A.concat(
      A.map(
        groups,
        (group): TStepOutput =>
          group.length > 1
            ? duplicateOutput(group)
            : userOutput(group[0], roleKeyById, options)
      ),
      A.map(invalid, invalidOutput)
    )
  );
};
