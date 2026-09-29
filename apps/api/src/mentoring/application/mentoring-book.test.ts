import { ACTIVITY_ACTION } from '@app/activity';
import {
  MENTOR_STATUS,
  mentoringBookInputSchema,
  type TMentoringBookInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentoringBook } from '#/mentoring/application/mentoring-book.ts';
import {
  activeMentor,
  HOUR_MS,
  MENTEE_ID,
  MENTOR_USER_ID,
  sessionLayerBuild,
  sessionMocksBuild,
  sessionRowBuild,
} from '#/mentoring/application/mentoring-test-kit.ts';
import { EBadRequest, EConflict } from '#/shared/errors.ts';

const inputAt = (offsetMs: number): TMentoringBookInput =>
  mentoringBookInputSchema.parse({
    mentorUserId: MENTOR_USER_ID,
    topic: 'Backend',
    scheduledAt: new Date(Date.now() + offsetMs).toISOString(),
  });

const run = (
  input: TMentoringBookInput,
  menteeId: string,
  mocks: ReturnType<typeof sessionMocksBuild>
): Promise<unknown> =>
  Effect.runPromise(
    mentoringBook(input, menteeId).pipe(
      Effect.provide(sessionLayerBuild(mocks)),
      Effect.flip
    )
  );

describe('mentoringBook', () => {
  it('books a pending session with an active mentor, keyed by user id', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());
    const input = inputAt(HOUR_MS);

    const result = await Effect.runPromise(
      mentoringBook(input, MENTEE_ID).pipe(
        Effect.provide(sessionLayerBuild(mocks))
      )
    );

    expect(result.mentor.userId).toBe(MENTOR_USER_ID);
    expect(mocks.findMentor).toHaveBeenCalledWith(MENTOR_USER_ID);
    expect(mocks.book).toHaveBeenCalledWith(input, MENTEE_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.MENTORING_SESSION_BOOK,
      })
    );
  });

  it('refuses to book a session with yourself', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());

    expect(await run(inputAt(HOUR_MS), MENTOR_USER_ID, mocks)).toBeInstanceOf(
      EBadRequest
    );
    expect(mocks.book).not.toHaveBeenCalled();
  });

  it('refuses a time in the past', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());

    expect(await run(inputAt(-HOUR_MS), MENTEE_ID, mocks)).toBeInstanceOf(
      EBadRequest
    );
    expect(mocks.book).not.toHaveBeenCalled();
  });

  it('refuses a mentor who is not active', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild(), {
      ...activeMentor,
      status: MENTOR_STATUS.PENDING,
    });

    expect(await run(inputAt(HOUR_MS), MENTEE_ID, mocks)).toBeInstanceOf(
      EBadRequest
    );
    expect(mocks.book).not.toHaveBeenCalled();
  });

  it('answers EConflict when the atomic insert found an overlapping session', async (): Promise<void> => {
    const mocks = sessionMocksBuild(null);

    expect(await run(inputAt(HOUR_MS), MENTEE_ID, mocks)).toBeInstanceOf(
      EConflict
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
