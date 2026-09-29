import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  STEP_NAME,
  type TStep,
  type TStepInput,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import { outputOf, outputsMerge } from '../../shared/step-output.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { rolesTransform } from './role-transform.ts';
import { usersTransform } from './user-transform.ts';

const run = (input: TStepInput): TStepOutput => {
  const roles = rolesTransform(input.legacy[LEGACY_TABLE.APP_ROLES]);
  return outputsMerge([
    usersTransform(
      input.legacy[LEGACY_TABLE.APP_USERS],
      roles.roleKeyById,
      input.options
    ),
    outputOf({
      inserts: [{ table: TARGET_TABLE.CUSTOM_ROLE, rows: roles.customRoles }],
      rejects: roles.rejects,
      adjustments: roles.adjustments,
    }),
  ]);
};

export const IAM_STEP: TStep = { name: STEP_NAME.IAM, run };
