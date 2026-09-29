import { MENTOR_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentorGet } from '#/mentor/application/mentor-public-get.ts';
import {
  MENTOR_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { ENotFound } from '#/shared/errors.ts';

describe('mentorGet', () => {
  it('shows an active mentor without private fields', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({
        status: MENTOR_STATUS.ACTIVE,
        phoneForVerification: '081234567890',
      })
    );

    const result = await Effect.runPromise(
      mentorGet({ id: MENTOR_ID }).pipe(Effect.provide(mentorLayerBuild(mocks)))
    );

    expect(result.id).toBe(MENTOR_ID);
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('phoneForVerification');
    expect(result).not.toHaveProperty('legalName');
  });

  it.each([
    MENTOR_STATUS.PENDING,
    MENTOR_STATUS.REJECTED,
    MENTOR_STATUS.INACTIVE,
  ])('hides a %s mentor from the public', async (status): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild({ status }));

    const error = await Effect.runPromise(
      mentorGet({ id: MENTOR_ID }).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
