import { PERMISSION } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import type { TLegacyHackathonUser } from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import type {
  TFileRef,
  TMigrationOptions,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import { stringArrayText } from '../../shared/json-text.ts';
import { outputOf, outputsMerge } from '../../shared/step-output.ts';
import type { TCustomRoleRow, TUserRow } from '../../target/target-rows.ts';
import type { THackathonParticipantRow } from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { valueRef } from '../shared/legacy-file.ts';
import {
  adminGrant,
  type TAdminGrant,
  type TGrantee,
} from '../shared/role-grant.ts';
import { HACKATHON_FILE_PREFIX, hackathonUrlFile } from './hackathon-file.ts';
import type { TIdentity } from './identity-remap.ts';

const USER_IMAGE_COLUMN = 'image';

export const HACKATHON_ADMIN_GRANT: TAdminGrant = {
  table: LEGACY_TABLE.HACKATHON_USERS,
  why: 'hackathon_users.is_admin',
  permissions: [PERMISSION.HACKATHON_MANAGE],
  forUser: { key: 'hackathon_admin', label: 'Hackathon admin' },
  forMentor: {
    key: 'hackathon_admin_mentor',
    label: 'Hackathon admin (mentor)',
  },
};

const participantOutput = (
  userId: string,
  row: TLegacyHackathonUser,
  user: TUserRow | undefined,
  options: TMigrationOptions
): TStepOutput => {
  const createdAt = row.created_at ?? options.now;
  const participant: THackathonParticipantRow = {
    user_id: userId,
    phone_number: row.phone_number,
    location: row.location,
    bio: row.bio,
    skills: stringArrayText(row.skills),
    created_at: createdAt,
    updated_at: row.updated_at ?? createdAt,
  };
  const avatar =
    user !== undefined && user.image === null
      ? hackathonUrlFile(
          row.avatar,
          HACKATHON_FILE_PREFIX.AVATAR,
          (stored): TFileRef =>
            valueRef(
              TARGET_TABLE.USER,
              userId,
              USER_IMAGE_COLUMN,
              stored,
              null
            ),
          options
        )
      : { stored: null, file: null };
  return outputOf({
    inserts: [
      { table: TARGET_TABLE.HACKATHON_PARTICIPANT, rows: [participant] },
    ],
    patches:
      avatar.stored === null
        ? []
        : [
            {
              table: TARGET_TABLE.USER,
              key: userId,
              set: { image: avatar.stored },
            },
          ],
    files: avatar.file === null ? [] : [avatar.file],
  });
};

export const participantsTransform = (
  identity: TIdentity,
  hackathonUsers: readonly TLegacyHackathonUser[],
  users: ReadonlyMap<string, TUserRow>,
  existingRoles: readonly TCustomRoleRow[],
  options: TMigrationOptions
): TStepOutput =>
  outputsMerge([
    outputOf({
      inserts: [{ table: TARGET_TABLE.USER, rows: identity.createdUsers }],
      adjustments: identity.adjustments,
    }),
    ...A.map(
      [...identity.representatives],
      ([userId, row]): TStepOutput =>
        participantOutput(userId, row, users.get(userId), options)
    ),
    adminGrant(
      HACKATHON_ADMIN_GRANT,
      A.filterMap(hackathonUsers, (row): TGrantee | undefined => {
        const userId = identity.uidOf(row.id);
        return row.is_admin === true && userId !== null
          ? { legacyId: row.id, userId }
          : undefined;
      }),
      users,
      existingRoles,
      options.now
    ),
  ]);
