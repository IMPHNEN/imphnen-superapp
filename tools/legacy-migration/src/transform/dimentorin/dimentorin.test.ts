import { describe, expect, it } from 'vitest';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { T2 } from '../../testing/fixture-builders.ts';
import {
  MENTOR_ID,
  MENTORS,
  MISSING_USER_ID,
  SESSION_ID,
  SESSIONS,
} from '../../testing/fixtures/dimentorin-fixture.ts';
import { IAM_ROLES, USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import { IAM_USERS } from '../../testing/fixtures/iam-users-fixture.ts';
import {
  adjustmentsFor,
  rejectsFor,
  rowOf,
  rowsIn,
  runSteps,
} from '../../testing/run-steps.ts';
import type { TSqlRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { IAM_STEP } from '../iam/iam-step.ts';
import { DIMENTORIN_STEP } from './dimentorin-step.ts';
import { mentorIdOf } from './mentor-transform.ts';

const result = runSteps(
  {
    [LEGACY_TABLE.APP_USERS]: IAM_USERS,
    [LEGACY_TABLE.APP_ROLES]: IAM_ROLES,
    [LEGACY_TABLE.APP_MENTORS]: MENTORS,
    [LEGACY_TABLE.SESSIONS]: SESSIONS,
  },
  [IAM_STEP, DIMENTORIN_STEP]
);
const mentor = (id: string): TSqlRow | undefined =>
  rowOf(result, TARGET_TABLE.MENTOR, id);
const session = (id: string): TSqlRow | undefined =>
  rowOf(result, TARGET_TABLE.MENTORING_SESSION, id);

describe('mentors', () => {
  it('maps status, lists, rate and the profile fields kept in user metadata', (): void => {
    expect(mentor(MENTOR_ID.BUDI)).toMatchObject({
      user_id: USER_ID.MENTOR,
      status: 'active',
      industries: '["Software","7"]',
      preferred_mentee_level: '["beginner"]',
      mentoring_rate: 100000,
      current_company: null,
      gender: 'female',
      domicile: 'Bandung',
      phone_number: '081234567890',
      identity_document_key: null,
    });
  });

  it('copies a legacy CV into a private R2 key', (): void => {
    expect(mentor(MENTOR_ID.BUDI)?.cv_key).toMatch(
      /^mentor\/cv\/[0-9a-f-]{36}\.pdf$/
    );
    expect(mentor(MENTOR_ID.BUDI)?.cv_legacy_url).toBeNull();
  });

  it('generates a stable id for a legacy row without one', (): void => {
    const applicant = MENTORS[2];
    const id = mentorIdOf(applicant);
    expect(mentor(id)).toMatchObject({
      status: 'pending',
      preferred_mentee_level: '[]',
      industries: '[]',
      mentoring_rate: null,
    });
    expect(mentorIdOf(applicant)).toBe(id);
    expect(
      adjustmentsFor(result, id).map((item): string => item.rule)
    ).toContain('mentor-id-generated');
  });

  it('keeps soft-deleted mentors as deleted rows and reports unknown statuses', (): void => {
    expect(mentor(MENTOR_ID.FORMER)).toMatchObject({
      status: 'inactive',
      deleted_at: T2,
    });
    expect(
      adjustmentsFor(result, MENTOR_ID.FORMER).map((item): string => item.rule)
    ).toContain('mentor-status-unknown');
  });

  it('rejects mentor rows whose user does not exist', (): void => {
    expect(mentor(MENTOR_ID.ORPHAN)).toBeUndefined();
    expect(rejectsFor(result, MENTOR_ID.ORPHAN)).toMatchObject([
      { reason: 'user-missing', detail: `user ${MISSING_USER_ID}` },
    ]);
  });

  it('gives active mentors the mentor role and takes it from holders without an active profile', (): void => {
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.MENTOR)?.role).toBe(
      'mentor'
    );
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.FORMER_MENTOR)?.role).toBe(
      'user'
    );
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.APPLICANT)?.role).toBe(
      'user'
    );
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.ADMIN)?.role).toBe('admin');
  });
});

describe('mentoring sessions', () => {
  it('copies a mentor_id that already is a user id', (): void => {
    expect(session(SESSION_ID.DIRECT)).toMatchObject({
      mentor_user_id: USER_ID.MENTOR,
      status: 'completed',
      rating: 5,
      session_type: 'offline',
    });
  });

  it('repairs a mentor_id that holds an app_mentors.id', (): void => {
    expect(session(SESSION_ID.REPAIRED)).toMatchObject({
      mentor_user_id: USER_ID.MENTOR,
      status: 'cancelled',
      session_type: 'online',
    });
    expect(
      adjustmentsFor(result, SESSION_ID.REPAIRED).map(
        (item): string => item.rule
      )
    ).toEqual(['session-mentor-repaired']);
  });

  it('rejects sessions whose mentor or mentee cannot be resolved', (): void => {
    expect(rejectsFor(result, SESSION_ID.UNRESOLVED)).toMatchObject([
      { reason: 'mentor-id-unresolved' },
    ]);
    expect(rejectsFor(result, SESSION_ID.MENTEE_MISSING)).toMatchObject([
      { reason: 'user-missing' },
    ]);
  });

  it('maps ongoing to confirmed and clears an out-of-range rating', (): void => {
    expect(session(SESSION_ID.ONGOING)).toMatchObject({
      status: 'confirmed',
      rating: null,
      session_type: 'online',
    });
    expect(rowsIn(result, TARGET_TABLE.MENTORING_SESSION)).toHaveLength(3);
  });
});
