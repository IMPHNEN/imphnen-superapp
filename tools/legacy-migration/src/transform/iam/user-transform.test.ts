import { describe, expect, it } from 'vitest';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  FIXTURE_OPTIONS,
  LEGACY_CDN_PREFIX,
  STORAGE_PUBLIC_URL,
  T1,
} from '../../testing/fixture-builders.ts';
import { IAM_ROLES, USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import {
  ARGON_HASH,
  IAM_USERS,
  legacyUser,
} from '../../testing/fixtures/iam-users-fixture.ts';
import {
  adjustmentsFor,
  rejectsFor,
  rowOf,
  rowsIn,
  runSteps,
} from '../../testing/run-steps.ts';
import type { TSqlRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { IAM_STEP } from './iam-step.ts';

const result = runSteps(
  { [LEGACY_TABLE.APP_USERS]: IAM_USERS, [LEGACY_TABLE.APP_ROLES]: IAM_ROLES },
  [IAM_STEP]
);
const user = (id: string): TSqlRow | undefined =>
  rowOf(result, TARGET_TABLE.USER, id);

describe('legacy users', () => {
  it('keeps ids and normalises emails', (): void => {
    expect(user(USER_ID.ADMIN)).toMatchObject({
      email: 'admin@imphnen.dev',
      name: 'Admin Utama',
      role: 'admin',
    });
  });

  it('moves the Argon2id hash into a credential account', (): void => {
    expect(rowsIn(result, TARGET_TABLE.ACCOUNT)).toContainEqual(
      expect.objectContaining({
        user_id: USER_ID.ADMIN,
        account_id: USER_ID.ADMIN,
        provider_id: 'credential',
        password: ARGON_HASH,
      })
    );
    expect(
      rowsIn(result, TARGET_TABLE.ACCOUNT).some(
        (row): boolean => row.user_id === USER_ID.NO_PASSWORD
      )
    ).toBe(false);
    expect(
      adjustmentsFor(result, USER_ID.NO_PASSWORD).map(
        (item): string => item.rule
      )
    ).toContain('account-skipped');
  });

  it('splits Rust is_active into email_verified and is_active', (): void => {
    expect(user(USER_ID.UNVERIFIED)).toMatchObject({
      email_verified: 0,
      is_active: 1,
    });
    expect(user(USER_ID.DISABLED)).toMatchObject({
      email_verified: 1,
      is_active: 0,
    });
    expect(user(USER_ID.ADMIN)).toMatchObject({
      email_verified: 1,
      is_active: 1,
    });
  });

  it('keeps soft-deleted users, inactive, so their ids stay valid', (): void => {
    expect(user(USER_ID.DELETED)).toMatchObject({
      deleted_at: T1,
      is_active: 0,
      name: 'hapus',
    });
  });

  it('maps roles, falling back to user for deleted roles', (): void => {
    expect(user(USER_ID.STAF)?.role).toBe('staf');
    expect(user(USER_ID.CONTENT)?.role).toBe('tim-konten-acara');
    expect(user(USER_ID.OPS)?.role).toBe('admin');
    expect(user(USER_ID.RETIRED_ROLE)?.role).toBe('user');
    expect(user(USER_ID.MENTEE)?.role).toBe('user');
  });

  it('writes one profile per user and logs unreadable metadata', (): void => {
    expect(rowsIn(result, TARGET_TABLE.USER_PROFILE)).toHaveLength(
      IAM_USERS.length
    );
    expect(
      rowOf(result, TARGET_TABLE.USER_PROFILE, USER_ID.MENTOR)
    ).toMatchObject({ domicile: 'Bandung', skills: '["Rust","TypeScript"]' });
    expect(
      rowOf(result, TARGET_TABLE.USER_PROFILE, USER_ID.BROKEN_JSON)
    ).toMatchObject({ skills: '[]', bio: null });
    expect(
      adjustmentsFor(result, USER_ID.WRONG_SHAPE).map(
        (item): string => item.rule
      )
    ).toContain('profile-metadata-invalid');
  });

  it('copies a legacy avatar into R2 and points user.image at it', (): void => {
    const image = String(user(USER_ID.ADMIN)?.image);
    const key = rowOf(
      result,
      TARGET_TABLE.USER_PROFILE,
      USER_ID.ADMIN
    )?.avatar_key;
    expect(key).toMatch(/^profile\/avatar\/[0-9a-f-]{36}\.jpg$/);
    expect(image).toBe(`${STORAGE_PUBLIC_URL}/${key}`);
    expect(result.files).toContainEqual(
      expect.objectContaining({
        targetKey: key,
        source: { kind: 's3', key: 'profiles/u101/abc-avatar.JPEG' },
        contentType: 'image/jpeg',
      })
    );
  });

  it('keeps avatar URLs as they are when no legacy prefix is configured', (): void => {
    const plain = runSteps(
      { [LEGACY_TABLE.APP_USERS]: IAM_USERS },
      [IAM_STEP],
      { ...FIXTURE_OPTIONS, legacyFileUrlPrefixes: [] }
    );
    expect(rowOf(plain, TARGET_TABLE.USER, USER_ID.ADMIN)?.image).toBe(
      `${LEGACY_CDN_PREFIX}profiles/u101/abc-avatar.JPEG`
    );
    expect(plain.files).toEqual([]);
  });

  it('blocks the run when two emails differ only by case or spaces', (): void => {
    const clash = runSteps(
      {
        [LEGACY_TABLE.APP_USERS]: [
          legacyUser({ id: 'u-1', email: 'Rina@Example.com ' }),
          legacyUser({ id: 'u-2', email: 'rina@example.com' }),
          legacyUser({ id: 'u-3', email: 'solo@example.com' }),
        ],
      },
      [IAM_STEP]
    );
    expect(rejectsFor(clash, 'u-1')).toMatchObject([
      { reason: 'duplicate-email', blocking: true },
    ]);
    expect(rejectsFor(clash, 'u-2')).toMatchObject([
      { reason: 'duplicate-email', blocking: true },
    ]);
    expect(
      rowsIn(clash, TARGET_TABLE.USER).map((row): unknown => row.id)
    ).toEqual(['u-3']);
  });

  it('rejects rows without a usable email instead of dropping them silently', (): void => {
    const invalid = runSteps(
      { [LEGACY_TABLE.APP_USERS]: [legacyUser({ id: 'u-9', email: '   ' })] },
      [IAM_STEP]
    );
    expect(rejectsFor(invalid, 'u-9')).toMatchObject([
      { reason: 'invalid-email', blocking: false },
    ]);
  });
});
