import { MENTOR_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentoringAvailability } from '#/mentoring/application/mentoring-availability.ts';
import {
  activeMentor,
  HOUR_MS,
  MENTOR_USER_ID,
  sessionLayerBuild,
  sessionMocksBuild,
} from '#/mentoring/application/mentoring-test-kit.ts';
import { ENotFound } from '#/shared/errors.ts';

describe('mentoringAvailability', () => {
  it('returns busy intervals without revealing who booked them', async (): Promise<void> => {
    const mocks = sessionMocksBuild(null);
    const start = new Date(Date.now() + HOUR_MS);
    const end = new Date(start.getTime() + HOUR_MS);
    mocks.busy.mockReturnValue(Effect.succeed([{ start, end }]));

    const result = await Effect.runPromise(
      mentoringAvailability({ mentorUserId: MENTOR_USER_ID }).pipe(
        Effect.provide(sessionLayerBuild(mocks))
      )
    );

    expect(result.busy).toEqual([
      { start: start.toISOString(), end: end.toISOString() },
    ]);
    expect(result.mentorId).toBe(activeMentor.id);
  });

  it('hides a mentor who is not active', async (): Promise<void> => {
    const mocks = sessionMocksBuild(null, {
      ...activeMentor,
      status: MENTOR_STATUS.PENDING,
    });

    const error = await Effect.runPromise(
      mentoringAvailability({ mentorUserId: MENTOR_USER_ID }).pipe(
        Effect.provide(sessionLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.busy).not.toHaveBeenCalled();
  });
});
