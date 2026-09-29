import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  STEP_NAME,
  type TStep,
  type TStepInput,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import { userIdsOf, usersOf } from '../../shared/state.ts';
import { insertedRows, outputsMerge } from '../../shared/step-output.ts';
import type { TMentorRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { mentorRoleFollowUp } from './mentor-role.ts';
import { mentorsTransform } from './mentor-transform.ts';
import { sessionsTransform } from './session-transform.ts';

const run = (input: TStepInput): TStepOutput => {
  const userIds = userIdsOf(input.state);
  const mentors = mentorsTransform(
    input.legacy[LEGACY_TABLE.APP_MENTORS],
    input.legacy[LEGACY_TABLE.APP_USERS],
    userIds,
    input.options
  );
  const mentorRows = insertedRows(
    mentors,
    TARGET_TABLE.MENTOR
  ) as readonly TMentorRow[];
  return outputsMerge([
    mentors,
    sessionsTransform(
      input.legacy[LEGACY_TABLE.SESSIONS],
      input.legacy[LEGACY_TABLE.APP_MENTORS],
      userIds
    ),
    mentorRoleFollowUp(usersOf(input.state), mentorRows),
  ]);
};

export const DIMENTORIN_STEP: TStep = { name: STEP_NAME.DIMENTORIN, run };
