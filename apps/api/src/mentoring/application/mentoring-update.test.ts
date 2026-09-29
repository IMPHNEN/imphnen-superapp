import { MENTORING_SESSION_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentoringUpdate } from '#/mentoring/application/mentoring-update.ts';
import {
  HOUR_MS,
  MENTEE_ID,
  MENTOR_USER_ID,
  SESSION_ID,
  STRANGER_ID,
  sessionLayerBuild,
  sessionMocksBuild,
  sessionRowBuild,
} from '#/mentoring/application/mentoring-test-kit.ts';
import type { TSessionActor } from '#/mentoring/domain/session-actor.ts';
import {
  EBadRequest,
  EConflict,
  EForbidden,
  ENotFound,
} from '#/shared/errors.ts';

const LINK = 'https://meet.test/abc';

const mentor: TSessionActor = { userId: MENTOR_USER_ID, canManage: false };
const mentee: TSessionActor = { userId: MENTEE_ID, canManage: false };
const manager: TSessionActor = { userId: STRANGER_ID, canManage: true };
const stranger: TSessionActor = { userId: STRANGER_ID, canManage: false };

const failureOf = (
  mocks: ReturnType<typeof sessionMocksBuild>,
  actor: TSessionActor,
  status?: typeof MENTORING_SESSION_STATUS.CONFIRMED,
  meetingLink?: string
): Promise<unknown> =>
  Effect.runPromise(
    mentoringUpdate({ id: SESSION_ID, status, meetingLink }, actor).pipe(
      Effect.provide(sessionLayerBuild(mocks)),
      Effect.flip
    )
  );

describe('mentoringUpdate', () => {
  it('lets the mentor confirm a pending session and set the link', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());
    const change = {
      status: MENTORING_SESSION_STATUS.CONFIRMED,
      meetingLink: LINK,
    };

    await Effect.runPromise(
      mentoringUpdate({ id: SESSION_ID, ...change }, mentor).pipe(
        Effect.provide(sessionLayerBuild(mocks))
      )
    );

    expect(mocks.change).toHaveBeenCalledWith(
      SESSION_ID,
      MENTORING_SESSION_STATUS.PENDING,
      change
    );
  });

  it('lets a session manager confirm too', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());

    await Effect.runPromise(
      mentoringUpdate(
        { id: SESSION_ID, status: MENTORING_SESSION_STATUS.CONFIRMED },
        manager
      ).pipe(Effect.provide(sessionLayerBuild(mocks)))
    );

    expect(mocks.change).toHaveBeenCalled();
  });

  it('forbids the mentee from confirming or setting the link', async (): Promise<void> => {
    const confirm = sessionMocksBuild(sessionRowBuild());
    const link = sessionMocksBuild(sessionRowBuild());

    expect(
      await failureOf(confirm, mentee, MENTORING_SESSION_STATUS.CONFIRMED)
    ).toBeInstanceOf(EForbidden);
    expect(await failureOf(link, mentee, undefined, LINK)).toBeInstanceOf(
      EForbidden
    );
    expect(confirm.change).not.toHaveBeenCalled();
    expect(link.change).not.toHaveBeenCalled();
  });

  it('hides the session from anyone who is not a participant', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());

    expect(
      await failureOf(mocks, stranger, MENTORING_SESSION_STATUS.CONFIRMED)
    ).toBeInstanceOf(ENotFound);
  });

  it('refuses to leave a terminal status', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({ status: MENTORING_SESSION_STATUS.CANCELLED })
    );

    expect(
      await failureOf(mocks, mentor, MENTORING_SESSION_STATUS.CONFIRMED)
    ).toBeInstanceOf(EConflict);
  });

  it('refuses to complete a session that has not started', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({ status: MENTORING_SESSION_STATUS.CONFIRMED })
    );

    const error = await Effect.runPromise(
      mentoringUpdate(
        { id: SESSION_ID, status: MENTORING_SESSION_STATUS.COMPLETED },
        mentor
      ).pipe(Effect.provide(sessionLayerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
  });

  it('completes a confirmed session once it has started', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({
        status: MENTORING_SESSION_STATUS.CONFIRMED,
        scheduledAt: new Date(Date.now() - HOUR_MS),
      })
    );

    await Effect.runPromise(
      mentoringUpdate(
        { id: SESSION_ID, status: MENTORING_SESSION_STATUS.COMPLETED },
        mentor
      ).pipe(Effect.provide(sessionLayerBuild(mocks)))
    );

    expect(mocks.change).toHaveBeenCalledWith(
      SESSION_ID,
      MENTORING_SESSION_STATUS.CONFIRMED,
      { status: MENTORING_SESSION_STATUS.COMPLETED }
    );
  });

  it('refuses a link change on a finished session', async (): Promise<void> => {
    const mocks = sessionMocksBuild(
      sessionRowBuild({ status: MENTORING_SESSION_STATUS.COMPLETED })
    );

    expect(await failureOf(mocks, mentor, undefined, LINK)).toBeInstanceOf(
      EConflict
    );
  });

  it('answers EConflict when the status changed underneath (lost update)', async (): Promise<void> => {
    const mocks = sessionMocksBuild(sessionRowBuild());
    mocks.change.mockReturnValue(Effect.succeed(null));

    expect(
      await failureOf(mocks, mentor, MENTORING_SESSION_STATUS.CONFIRMED)
    ).toBeInstanceOf(EConflict);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
