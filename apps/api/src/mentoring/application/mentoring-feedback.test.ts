import { MENTORING_SESSION_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentoringFeedback } from '#/mentoring/application/mentoring-feedback.ts';
import {
  MENTEE_ID,
  MENTOR_USER_ID,
  SESSION_ID,
  sessionLayerBuild,
  sessionMocksBuild,
  sessionRowBuild,
} from '#/mentoring/application/mentoring-test-kit.ts';
import type { TSessionActor } from '#/mentoring/domain/session-actor.ts';
import { EConflict, EForbidden } from '#/shared/errors.ts';

const input = { id: SESSION_ID, feedback: 'Very helpful session', rating: 5 };
const mentee: TSessionActor = { userId: MENTEE_ID, canManage: false };

const completed = sessionRowBuild({
  status: MENTORING_SESSION_STATUS.COMPLETED,
});

describe('mentoringFeedback', () => {
  it('stores the mentee feedback once for a completed session', async (): Promise<void> => {
    const mocks = sessionMocksBuild(completed);

    await Effect.runPromise(
      mentoringFeedback(input, mentee).pipe(
        Effect.provide(sessionLayerBuild(mocks))
      )
    );

    expect(mocks.feedbackSet).toHaveBeenCalledWith(input, MENTEE_ID);
  });

  it('forbids the mentor from rating their own session', async (): Promise<void> => {
    const mocks = sessionMocksBuild(completed);

    const error = await Effect.runPromise(
      mentoringFeedback(input, {
        userId: MENTOR_USER_ID,
        canManage: true,
      }).pipe(Effect.provide(sessionLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.feedbackSet).not.toHaveBeenCalled();
  });

  it('refuses feedback before the session is completed', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({ status: MENTORING_SESSION_STATUS.CONFIRMED })
    );

    const error = await Effect.runPromise(
      mentoringFeedback(input, mentee).pipe(
        Effect.provide(sessionLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
  });

  it('refuses to overwrite feedback already given', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({
        status: MENTORING_SESSION_STATUS.COMPLETED,
        feedbackSubmittedAt: new Date(),
      })
    );

    const error = await Effect.runPromise(
      mentoringFeedback(input, mentee).pipe(
        Effect.provide(sessionLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.feedbackSet).not.toHaveBeenCalled();
  });

  it('answers EConflict when a concurrent submission won', async (): Promise<void> => {
    const mocks = sessionMocksBuild(completed);
    mocks.feedbackSet.mockReturnValue(Effect.succeed(null));

    const error = await Effect.runPromise(
      mentoringFeedback(input, mentee).pipe(
        Effect.provide(sessionLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
  });
});
