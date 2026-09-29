import { MENTOR_STATUS } from '@app/schemas';
import { ROLE } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import type { TStepOutput } from '../../pipeline/step-types.ts';
import { outputOf, outputsMerge } from '../../shared/step-output.ts';
import type { TMentorRow, TUserRow } from '../../target/target-rows.ts';
import { roleChange } from '../shared/role-grant.ts';

const ADMIN_ROLES: readonly string[] = [ROLE.SUPERADMIN, ROLE.ADMIN];

export const mentorRoleFollowUp = (
  users: readonly TUserRow[],
  mentors: readonly TMentorRow[]
): TStepOutput => {
  const activeMentorUsers = new Set(
    A.filterMap(mentors, (mentor): string | undefined =>
      mentor.status === MENTOR_STATUS.ACTIVE && mentor.deleted_at === null
        ? mentor.user_id
        : undefined
    )
  );
  return outputsMerge(
    A.map(
      users,
      (user): TStepOutput =>
        match({
          active: activeMentorUsers.has(user.id),
          role: user.role,
          admin: A.includes(ADMIN_ROLES, user.role),
        })
          .with(
            { active: true, admin: false, role: ROLE.MENTOR },
            (): TStepOutput => outputOf({})
          )
          .with(
            { active: true, admin: false },
            (): TStepOutput =>
              roleChange(
                LEGACY_TABLE.APP_MENTORS,
                user,
                ROLE.MENTOR,
                'active mentor profile'
              )
          )
          .with(
            { active: false, role: ROLE.MENTOR },
            (): TStepOutput =>
              roleChange(
                LEGACY_TABLE.APP_MENTORS,
                user,
                ROLE.USER,
                'no active mentor profile'
              )
          )
          .otherwise((): TStepOutput => outputOf({}))
    )
  );
};
