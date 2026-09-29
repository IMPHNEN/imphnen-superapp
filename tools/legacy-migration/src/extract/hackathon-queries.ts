import { LEGACY_TABLE } from '../legacy/legacy-table.ts';
import { arrayAsJson, col, ms, selectFrom } from './sql-fragments.ts';

const BY_ID = '"id"';

export const HACKATHON_QUERIES = {
  [LEGACY_TABLE.HACKATHON_USERS]: selectFrom(
    LEGACY_TABLE.HACKATHON_USERS,
    [
      col('id'),
      col('email'),
      col('fullname'),
      col('avatar'),
      col('phone_number'),
      col('location'),
      col('bio'),
      arrayAsJson('skills'),
      col('is_admin'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_TEAMS]: selectFrom(
    LEGACY_TABLE.HACKATHON_TEAMS,
    [
      col('id'),
      col('name'),
      col('description'),
      col('city'),
      col('visibility'),
      col('logo'),
      col('banner'),
      col('leader_id'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_TEAM_MEMBERS]: selectFrom(
    LEGACY_TABLE.HACKATHON_TEAM_MEMBERS,
    [
      col('id'),
      col('team_id'),
      col('user_id'),
      col('role'),
      col('status'),
      ms('joined_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS]: selectFrom(
    LEGACY_TABLE.HACKATHON_TEAM_INVITATIONS,
    [
      col('id'),
      col('team_id'),
      col('inviter_id'),
      col('invitee_email'),
      col('status'),
      ms('created_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS]: selectFrom(
    LEGACY_TABLE.HACKATHON_TEAM_JOIN_REQUESTS,
    [
      col('id'),
      col('team_id'),
      col('user_id'),
      col('message'),
      col('status'),
      ms('created_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS]: selectFrom(
    LEGACY_TABLE.HACKATHON_PROJECT_SUBMISSIONS,
    [
      col('id'),
      col('team_id'),
      col('project_name'),
      col('description'),
      col('repository_url'),
      col('demo_url'),
      col('presentation_url'),
      arrayAsJson('screenshots'),
      col('status'),
      ms('submitted_at'),
      col('submitted_by'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_WINNERS]: selectFrom(
    LEGACY_TABLE.HACKATHON_WINNERS,
    [
      col('id'),
      col('team_id'),
      col('rank'),
      col('prize'),
      ms('announced_at'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.HACKATHON_TEAM_MESSAGES]: selectFrom(
    LEGACY_TABLE.HACKATHON_TEAM_MESSAGES,
    [
      col('id'),
      col('team_id'),
      col('user_id'),
      col('message'),
      ms('created_at'),
    ],
    BY_ID
  ),
} as const;
