import { describe, expect, it } from 'vitest';
import { STORAGE_PUBLIC_URL, T1 } from '../../testing/fixture-builders.ts';
import {
  HACKER_ID,
  TEAM_ID,
} from '../../testing/fixtures/hackathon-fixture.ts';
import { USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import { REHEARSAL_DATASET } from '../../testing/fixtures/rehearsal-dataset.ts';
import {
  adjustmentsFor,
  rejectsFor,
  rowOf,
  rowsIn,
  runSteps,
} from '../../testing/run-steps.ts';
import { fixtureId } from '../../testing/fixture-builders.ts';
import type { TSqlRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { PIPELINE_STEPS } from '../../pipeline/pipeline-steps.ts';

const result = runSteps(REHEARSAL_DATASET, PIPELINE_STEPS);
const user = (id: string): TSqlRow | undefined =>
  rowOf(result, TARGET_TABLE.USER, id);
const members = (teamId: string): readonly TSqlRow[] =>
  rowsIn(result, TARGET_TABLE.HACKATHON_TEAM_MEMBER).filter(
    (row): boolean => row.team_id === teamId
  );

describe('hackathon identity remap', () => {
  it('matches a hackathon user to the platform user with the same email in any case', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_TEAM, TEAM_ID.ALPHA)?.leader_id
    ).toBe(USER_ID.SARI);
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_PARTICIPANT, USER_ID.SARI)
    ).toMatchObject({ phone_number: '0812000000', skills: '["React","Go"]' });
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_PARTICIPANT, HACKER_ID.SARI)
    ).toBeUndefined();
  });

  it('falls back to the platform user with the same id when the email changed', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_PARTICIPANT, USER_ID.RENAMED)
    ).toMatchObject({ skills: '[]' });
  });

  it('creates a login-less user for hackathon users unknown to IAM', (): void => {
    expect(user(HACKER_ID.NEWBIE)).toMatchObject({
      email: 'newbie@gmail.com',
      name: 'Newbie Coder',
      email_verified: 0,
      image: 'https://avatars.githubusercontent.com/u/1',
    });
    expect(
      rowsIn(result, TARGET_TABLE.ACCOUNT).some(
        (row): boolean => row.user_id === HACKER_ID.NEWBIE
      )
    ).toBe(false);
    expect(
      adjustmentsFor(result, HACKER_ID.NEWBIE).map(
        (entry): string => entry.rule
      )
    ).toContain('hackathon-user-created');
  });

  it('merges hackathon rows whose emails differ only by case, keeping the latest profile', (): void => {
    expect(user(HACKER_ID.TWIN_B)).toMatchObject({
      email: 'kembar@gmail.com',
      name: 'Kembar Baru',
    });
    expect(user(HACKER_ID.TWIN_A)).toBeUndefined();
  });

  it('copies a bare avatar key and sets it only where the user had no image', (): void => {
    expect(user(USER_ID.SARI)?.image).toBe(
      `${STORAGE_PUBLIC_URL}/hackathon/avatar/sari.png`
    );
  });

  it('maps is_admin to the custom hackathon admin roles by current role', (): void => {
    expect(user(HACKER_ID.NEWBIE)?.role).toBe('hackathon_admin');
    expect(user(USER_ID.RENAMED)?.role).toBe('hackathon_admin_mentor');
    const keys = rowsIn(result, TARGET_TABLE.CUSTOM_ROLE).map(
      (row): unknown => row.key
    );
    expect(keys).toEqual(
      expect.arrayContaining(['hackathon_admin', 'hackathon_admin_mentor'])
    );
  });

  it('fills a missing created_at with the migration time', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_PARTICIPANT, HACKER_ID.LEAD)
        ?.created_at
    ).toBe(user(HACKER_ID.LEAD)?.created_at);
  });
});

describe('hackathon teams and members', () => {
  it('normalises visibility and copies logos and banners into R2 keys', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_TEAM, TEAM_ID.ALPHA)
    ).toMatchObject({
      visibility: 'public',
      logo_key: 'hackathon/team/alpha-logo.png',
    });
    expect(
      String(
        rowOf(result, TARGET_TABLE.HACKATHON_TEAM, TEAM_ID.ALPHA)?.banner_key
      )
    ).toMatch(/^hackathon\/team\/[0-9a-f-]{36}\.webp$/);
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_TEAM, TEAM_ID.BETA)
    ).toMatchObject({ visibility: 'private', banner_key: null });
  });

  it('rejects a team whose leader cannot be resolved, and its children', (): void => {
    expect(rejectsFor(result, TEAM_ID.GHOST)).toMatchObject([
      { reason: 'user-missing' },
    ]);
    expect(rejectsFor(result, fixtureId(1307))).toMatchObject([
      { reason: 'team-missing' },
    ]);
    expect(rejectsFor(result, fixtureId(1702))).toMatchObject([
      { reason: 'team-missing' },
    ]);
  });

  it('keeps one team per user, drops inactive rows and normalises roles', (): void => {
    expect(rejectsFor(result, fixtureId(1304))).toMatchObject([
      { reason: 'member-duplicate' },
    ]);
    expect(rejectsFor(result, fixtureId(1306))).toMatchObject([
      { reason: 'member-inactive' },
    ]);
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_TEAM_MEMBER, fixtureId(1302))
    ).toMatchObject({
      user_id: USER_ID.RENAMED,
      role: 'member',
      joined_at: T1,
    });
  });

  it('inserts a missing leader row and reports a leader who sits in another team', (): void => {
    expect(
      members(TEAM_ID.GAMMA).map((row): unknown => [row.user_id, row.role])
    ).toEqual(
      expect.arrayContaining([
        [HACKER_ID.LEAD, 'leader'],
        [HACKER_ID.TWIN_B, 'member'],
      ])
    );
    expect(
      adjustmentsFor(result, TEAM_ID.BETA).map((entry): string => entry.rule)
    ).toContain('hackathon-leader-missing');
  });
});
