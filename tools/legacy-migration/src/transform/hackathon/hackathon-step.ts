import { A } from '@mobily/ts-belt';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  STEP_NAME,
  type TStep,
  type TStepInput,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import { rowsOf, usersById, usersOf } from '../../shared/state.ts';
import { insertedRows, outputsMerge } from '../../shared/step-output.ts';
import type { TCustomRoleRow, TUserRow } from '../../target/target-rows.ts';
import type { THackathonTeamRow } from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import {
  invitationsTransform,
  joinRequestsTransform,
} from './decision-transform.ts';
import { identityRemap } from './identity-remap.ts';
import { membersTransform } from './member-transform.ts';
import { participantsTransform } from './participant-transform.ts';
import { submissionsTransform } from './submission-transform.ts';
import { teamsTransform } from './team-transform.ts';
import {
  messagesTransform,
  winnersTransform,
} from './winner-message-transform.ts';

const run = (input: TStepInput): TStepOutput => {
  const legacy = input.legacy;
  const now = input.options.now;
  const hackathonUsers = legacy[LEGACY_TABLE.HACKATHON_USERS];
  const identity = identityRemap(
    hackathonUsers,
    usersOf(input.state),
    input.options
  );
  const users = new Map([
    ...usersById(input.state),
    ...A.map(identity.createdUsers, (user): [string, TUserRow] => [
      user.id,
      user,
    ]),
  ]);
  const teams = teamsTransform(
    legacy[LEGACY_TABLE.HACKATHON_TEAMS],
    identity.uidOf,
    input.options
  );
  const teamRows = insertedRows(
    teams,
    TARGET_TABLE.HACKATHON_TEAM
  ) as readonly THackathonTeamRow[];
  const teamIds = new Set(A.map(teamRows, (team): string => team.id));
  return outputsMerge([
    participantsTransform(
      identity,
      hackathonUsers,
      users,
      rowsOf(
        input.state,
        TARGET_TABLE.CUSTOM_ROLE
      ) as readonly TCustomRoleRow[],
      input.options
    ),
    teams,
    membersTransform(
      legacy[LEGACY_TABLE.HACKATHON_TEAM_MEMBERS],
      teamRows,
      identity.uidOf
    ),
    invitationsTransform(
      legacy[LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS],
      teamIds,
      identity.uidOf,
      now
    ),
    joinRequestsTransform(
      legacy[LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS],
      teamIds,
      identity.uidOf,
      now
    ),
    submissionsTransform(
      legacy[LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS],
      teamIds,
      identity.uidOf,
      input.options
    ),
    winnersTransform(legacy[LEGACY_TABLE.HACKATHON_WINNERS], teamIds, now),
    messagesTransform(
      legacy[LEGACY_TABLE.HACKATHON_TEAM_MESSAGES],
      teamIds,
      identity.uidOf,
      now
    ),
  ]);
};

export const HACKATHON_STEP: TStep = { name: STEP_NAME.HACKATHON, run };
