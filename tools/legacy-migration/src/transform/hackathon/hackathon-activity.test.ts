import { describe, expect, it } from 'vitest';
import {
  STORAGE_PUBLIC_URL,
  T0,
  T1,
  T2,
} from '../../testing/fixture-builders.ts';
import { HACKER_ID } from '../../testing/fixtures/hackathon-fixture.ts';
import { SUBMISSION_ID } from '../../testing/fixtures/hackathon-activity-fixture.ts';
import { USER_ID } from '../../testing/fixtures/iam-fixture.ts';
import { REHEARSAL_DATASET } from '../../testing/fixtures/rehearsal-dataset.ts';
import { rejectsFor, rowOf, runSteps } from '../../testing/run-steps.ts';
import { fixtureId } from '../../testing/fixture-builders.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { PIPELINE_STEPS } from '../../pipeline/pipeline-steps.ts';

const result = runSteps(REHEARSAL_DATASET, PIPELINE_STEPS);

describe('hackathon invitations, requests, submissions, winners and messages', () => {
  it('lowercases invitee emails and keeps only the newest pending duplicate', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_INVITATION, fixtureId(1402))
    ).toMatchObject({
      invitee_email: 'teman@gmail.com',
      status: 'pending',
      updated_at: T1,
    });
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_INVITATION, fixtureId(1401))?.status
    ).toBe('rejected');
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_INVITATION, fixtureId(1403))?.status
    ).toBe('rejected');
    expect(rejectsFor(result, fixtureId(1404))).toMatchObject([
      { reason: 'user-missing' },
    ]);
  });

  it('dedupes pending join requests per remapped user and fills empty messages', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_JOIN_REQUEST, fixtureId(1501))
    ).toMatchObject({
      message: '',
      status: 'rejected',
      user_id: HACKER_ID.TWIN_B,
    });
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_JOIN_REQUEST, fixtureId(1502))
        ?.status
    ).toBe('pending');
  });

  it('keeps the most advanced submission per team and moves its files', (): void => {
    const final = rowOf(
      result,
      TARGET_TABLE.HACKATHON_SUBMISSION,
      SUBMISSION_ID.FINAL
    );
    expect(final).toMatchObject({
      status: 'submitted',
      created_by: null,
      presentation_url: `${STORAGE_PUBLIC_URL}/hackathon/submission/deck.pdf`,
      video_url: null,
    });
    const shots = JSON.parse(String(final?.screenshot_keys)) as string[];
    expect(shots[0]).toBe('hackathon/submission/one.png');
    expect(shots).toHaveLength(2);
    expect(rejectsFor(result, SUBMISSION_ID.DRAFT)).toMatchObject([
      { reason: 'submission-duplicate' },
    ]);
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_SUBMISSION, SUBMISSION_ID.BETA)
    ).toMatchObject({
      status: 'draft',
      presentation_url: 'https://slides.com/x',
    });
  });

  it('fills winner and message timestamps and drops authorless messages', (): void => {
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_WINNER, fixtureId(1701))
    ).toMatchObject({ announced_at: T2, updated_at: T2 });
    expect(
      rowOf(result, TARGET_TABLE.HACKATHON_MESSAGE, fixtureId(1801))
    ).toMatchObject({ user_id: USER_ID.RENAMED, created_at: T1 });
    expect(rejectsFor(result, fixtureId(1802))).toMatchObject([
      { reason: 'user-missing' },
    ]);
    expect(T0).toBeLessThan(T1);
  });
});
