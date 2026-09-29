import { LEGACY_TABLE } from '../legacy/legacy-table.ts';
import { col, jsonAsText, ms, selectFrom } from './sql-fragments.ts';

const BY_CREATED = '"created_at", "id"';

export const CORE_QUERIES = {
  [LEGACY_TABLE.APP_USERS]: selectFrom(
    LEGACY_TABLE.APP_USERS,
    [
      col('id'),
      col('email'),
      col('password_hash'),
      col('role_id'),
      col('first_name'),
      col('last_name'),
      col('avatar_url'),
      col('is_verified'),
      col('is_active'),
      jsonAsText('metadata'),
      ms('created_at'),
      ms('updated_at'),
      ms('deleted_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.APP_ROLES]: selectFrom(
    LEGACY_TABLE.APP_ROLES,
    [
      col('id'),
      col('name'),
      col('description'),
      jsonAsText('permissions'),
      ms('created_at'),
      ms('updated_at'),
      ms('deleted_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.APP_MENTORS]: selectFrom(
    LEGACY_TABLE.APP_MENTORS,
    [
      col('id'),
      col('user_id'),
      jsonAsText('industries'),
      jsonAsText('expertise'),
      jsonAsText('languages'),
      col('current_company'),
      col('current_role'),
      col('years_of_experience'),
      jsonAsText('topics_of_interest'),
      col('preferred_mentee_level'),
      jsonAsText('preferred_mentoring_formats'),
      col('availability_commitment'),
      col('mentoring_rate'),
      col('status'),
      col('is_deleted'),
      ms('created_at'),
      ms('updated_at'),
    ],
    '"created_at", "user_id"'
  ),
  [LEGACY_TABLE.SESSIONS]: selectFrom(
    LEGACY_TABLE.SESSIONS,
    [
      col('id'),
      col('mentor_id'),
      col('mentee_id'),
      col('topic'),
      col('description'),
      ms('scheduled_at'),
      col('duration_minutes'),
      col('meeting_link'),
      col('session_type'),
      col('status'),
      col('feedback'),
      col('rating'),
      ms('feedback_submitted_at'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_CREATED
  ),
} as const;
