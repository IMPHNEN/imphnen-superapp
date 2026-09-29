import { describe, expect, it } from 'vitest';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { T0, T1, T2 } from '../../testing/fixture-builders.ts';
import {
  EVENT_ID,
  EVENTS,
  PNG_BASE64,
  QR_CAMPAIGNS,
  QR_ID,
  QR_USERS,
  ROADMAP_ID,
  ROADMAP_ITEMS,
  TESTIMONIAL_ID,
  TESTIMONIALS,
} from '../../testing/fixtures/cms-fixture.ts';
import { MENTORS } from '../../testing/fixtures/dimentorin-fixture.ts';
import { IAM_ROLES, USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import { IAM_USERS } from '../../testing/fixtures/iam-users-fixture.ts';
import {
  adjustmentsFor,
  rejectsFor,
  rowOf,
  rowsIn,
  runSteps,
} from '../../testing/run-steps.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { DIMENTORIN_STEP } from '../dimentorin/dimentorin-step.ts';
import { IAM_STEP } from '../iam/iam-step.ts';
import { CMS_STEP } from './cms-step.ts';

const DAY_MS = 86_400_000;
const result = runSteps(
  {
    [LEGACY_TABLE.APP_USERS]: IAM_USERS,
    [LEGACY_TABLE.APP_ROLES]: IAM_ROLES,
    [LEGACY_TABLE.APP_MENTORS]: MENTORS,
    [LEGACY_TABLE.EVENTS]: EVENTS,
    [LEGACY_TABLE.TESTIMONIALS]: TESTIMONIALS,
    [LEGACY_TABLE.ROADMAP_ITEMS]: ROADMAP_ITEMS,
    [LEGACY_TABLE.QR_CAMPAIGNS]: QR_CAMPAIGNS,
    [LEGACY_TABLE.QR_USERS]: QR_USERS,
  },
  [IAM_STEP, DIMENTORIN_STEP, CMS_STEP]
);

describe('events, testimonials and roadmap', () => {
  it('turns is_deleted into deleted_at and rounds the price to whole rupiah', (): void => {
    expect(rowOf(result, TARGET_TABLE.EVENT, EVENT_ID.MEETUP)).toMatchObject({
      price: 50000,
      deleted_at: null,
      is_online: 0,
    });
    expect(rowOf(result, TARGET_TABLE.EVENT, EVENT_ID.WORKSHOP)).toMatchObject({
      price: 13,
      deleted_at: T2,
    });
    expect(rowOf(result, TARGET_TABLE.EVENT, EVENT_ID.ODD)?.price).toBe(0);
    expect(
      adjustmentsFor(result, EVENT_ID.ODD).map((entry): string => entry.rule)
    ).toEqual(['event-price-clamped']);
  });

  it('migrates testimonials as approved and rejects orphans', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.TESTIMONIAL, TESTIMONIAL_ID.OK)
    ).toMatchObject({
      status: 'approved',
      approved_at: T0,
      reviewed_by: null,
      deleted_at: null,
    });
    expect(
      rowOf(result, TARGET_TABLE.TESTIMONIAL, TESTIMONIAL_ID.HIDDEN)?.deleted_at
    ).toBe(T1);
    expect(rejectsFor(result, TESTIMONIAL_ID.ORPHAN)).toMatchObject([
      { reason: 'user-missing' },
    ]);
  });

  it('moves roadmap votes into legacy_votes and defaults unknown statuses', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.ROADMAP_ITEM, ROADMAP_ID.WIP)
    ).toMatchObject({ status: 'in_progress', legacy_votes: 42 });
    expect(
      rowOf(result, TARGET_TABLE.ROADMAP_ITEM, ROADMAP_ID.PLANNED)
    ).toMatchObject({ status: 'upcoming', legacy_votes: 3, deleted_at: T2 });
  });
});

describe('QR campaigns and QR admins', () => {
  it('keeps only the most recently updated campaign active', (): void => {
    expect(rowOf(result, TARGET_TABLE.QR_CAMPAIGN, QR_ID.NEW)?.is_active).toBe(
      1
    );
    expect(rowOf(result, TARGET_TABLE.QR_CAMPAIGN, QR_ID.OLD)?.is_active).toBe(
      0
    );
  });

  it('uploads the stored PNG bytes to R2 and stores the key', (): void => {
    const key = `qr/campaign/${QR_ID.NEW}.png`;
    expect(
      rowOf(result, TARGET_TABLE.QR_CAMPAIGN, QR_ID.NEW)?.qr_image_key
    ).toBe(key);
    expect(result.files).toContainEqual(
      expect.objectContaining({
        targetKey: key,
        contentType: 'image/png',
        source: { kind: 'inline', base64: PNG_BASE64 },
      })
    );
  });

  it('fills missing timestamps and clears an unknown creator', (): void => {
    expect(rowOf(result, TARGET_TABLE.QR_CAMPAIGN, QR_ID.DRAFT)).toMatchObject({
      created_by: null,
      qr_image_key: null,
      created_at: T2 - 30 * DAY_MS,
      updated_at: T2 - 30 * DAY_MS,
    });
  });

  it('gives QR admins a custom role that keeps the member permissions', (): void => {
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.QR_ADMIN)?.role).toBe(
      'qr_admin'
    );
    expect(rowOf(result, TARGET_TABLE.USER, USER_ID.ADMIN)?.role).toBe('admin');
    const role = rowsIn(result, TARGET_TABLE.CUSTOM_ROLE).find(
      (row): boolean => row.key === 'qr_admin'
    );
    expect(JSON.parse(String(role?.permissions))).toEqual(
      expect.arrayContaining([
        'qr-campaign:create',
        'qr-campaign:delete',
        'gacha:roll',
        'roadmap:vote',
      ])
    );
    expect(
      rowsIn(result, TARGET_TABLE.CUSTOM_ROLE).some(
        (row): boolean => row.key === 'qr_admin_mentor'
      )
    ).toBe(false);
  });

  it('flags QR admins that cannot be granted automatically', (): void => {
    expect(
      result.adjustments.filter(
        (entry): boolean => entry.rule === 'role-grant-manual'
      )
    ).toHaveLength(1);
  });
});
