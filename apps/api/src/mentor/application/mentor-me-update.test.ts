import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentorMeUpdate } from '#/mentor/application/mentor-me-update.ts';
import {
  MENTOR_ID,
  MENTOR_USER_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { ENotFound } from '#/shared/errors.ts';

const LINKEDIN = 'https://linkedin.com/in/mentor';

describe('mentorMeUpdate', () => {
  it('persists user-level profile fields and clears nulls on the own profile', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());
    const patch = { linkedinUrl: LINKEDIN, twitterUrl: null, expertise: [] };

    await Effect.runPromise(
      mentorMeUpdate(patch, MENTOR_USER_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(mocks.findByUserId).toHaveBeenCalledWith(MENTOR_USER_ID);
    expect(mocks.update).toHaveBeenCalledWith(MENTOR_ID, patch);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.MENTOR_UPDATE,
        metadata: expect.objectContaining({
          [ACTIVITY_DETAIL.CHANGED_FIELDS]:
            'linkedinUrl, twitterUrl, expertise',
        }),
      })
    );
  });

  it('fails with ENotFound for a user without an application', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);

    const error = await Effect.runPromise(
      mentorMeUpdate({ bio: 'b'.repeat(60) }, MENTOR_USER_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
