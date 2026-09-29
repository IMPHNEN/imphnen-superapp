import { MENTORING_SESSION_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentoringCancel } from '#/mentoring/application/mentoring-cancel.ts';
import {
  MENTEE_ID,
  SESSION_ID,
  STRANGER_ID,
  sessionLayerBuild,
  sessionMocksBuild,
  sessionRowBuild,
} from '#/mentoring/application/mentoring-test-kit.ts';
import { EConflict, ENotFound } from '#/shared/errors.ts';

describe('mentoringCancel', () => {
  it.each([
    MENTORING_SESSION_STATUS.PENDING,
    MENTORING_SESSION_STATUS.CONFIRMED,
  ])('lets the mentee cancel a %s session', async (status): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild({ status }));

    await Effect.runPromise(
      mentoringCancel(
        { id: SESSION_ID },
        { userId: MENTEE_ID, canManage: false }
      ).pipe(Effect.provide(sessionLayerBuild(mocks)))
    );

    expect(mocks.change).toHaveBeenCalledWith(SESSION_ID, status, {
      status: MENTORING_SESSION_STATUS.CANCELLED,
    });
  });

  it.each([
    MENTORING_SESSION_STATUS.COMPLETED,
    MENTORING_SESSION_STATUS.NO_SHOW,
    MENTORING_SESSION_STATUS.CANCELLED,
  ])('refuses to cancel a %s session', async (status): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild({ status }));

    const error = await Effect.runPromise(
      mentoringCancel(
        { id: SESSION_ID },
        { userId: MENTEE_ID, canManage: false }
      ).pipe(Effect.provide(sessionLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it('does not let a stranger cancel', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());

    const error = await Effect.runPromise(
      mentoringCancel(
        { id: SESSION_ID },
        { userId: STRANGER_ID, canManage: false }
      ).pipe(Effect.provide(sessionLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
