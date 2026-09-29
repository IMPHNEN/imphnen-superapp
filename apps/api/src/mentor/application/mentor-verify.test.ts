import { ACTIVITY_ACTION } from '@app/activity';
import { MENTOR_REVIEW_DECISION, MENTOR_STATUS } from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  ACTOR_ID,
  MENTOR_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { mentorVerify } from '#/mentor/application/mentor-verify.ts';
import { EBadRequest, EConflict, ENotFound } from '#/shared/errors.ts';

const DOCUMENT_KEY = 'mentor/identity/doc.pdf';

const approve = { id: MENTOR_ID, decision: MENTOR_REVIEW_DECISION.APPROVE };
const reject = { id: MENTOR_ID, decision: MENTOR_REVIEW_DECISION.REJECT };

describe('mentorVerify', () => {
  it('approves a pending application with an identity document', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({ identityDocumentKey: DOCUMENT_KEY })
    );
    mocks.review.mockReturnValue(
      Effect.succeed(
        mentorRowBuild({
          status: MENTOR_STATUS.ACTIVE,
          identityDocumentKey: DOCUMENT_KEY,
        })
      )
    );

    const result = await Effect.runPromise(
      mentorVerify(approve, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(result.status).toBe(MENTOR_STATUS.ACTIVE);
    expect(mocks.review).toHaveBeenCalledWith(approve, ACTOR_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.MENTOR_APPROVE })
    );
  });

  it('refuses to approve without an identity document', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());

    const error = await Effect.runPromise(
      mentorVerify(approve, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it('rejects without requiring a document', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());
    mocks.review.mockReturnValue(
      Effect.succeed(mentorRowBuild({ status: MENTOR_STATUS.REJECTED }))
    );

    const result = await Effect.runPromise(
      mentorVerify(reject, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(result.status).toBe(MENTOR_STATUS.REJECTED);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.MENTOR_REJECT })
    );
  });

  it('refuses to reject a mentor who is already active', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({ status: MENTOR_STATUS.ACTIVE })
    );

    const error = await Effect.runPromise(
      mentorVerify(reject, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it('fails with EConflict when the status changed before the write', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({ identityDocumentKey: DOCUMENT_KEY })
    );
    mocks.review.mockReturnValue(Effect.succeed(null));

    const error = await Effect.runPromise(
      mentorVerify(approve, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('fails with ENotFound for an unknown or deleted mentor', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);

    const error = await Effect.runPromise(
      mentorVerify(approve, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });
});
