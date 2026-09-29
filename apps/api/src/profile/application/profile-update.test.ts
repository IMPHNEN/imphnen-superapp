import { ACTIVITY_ACTION, ACTIVITY_DETAIL } from '@app/activity';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { ENotFound } from '#/shared/errors.ts';
import { profileUpdate } from '#/profile/application/profile-update.ts';
import {
  profileLayerBuild,
  profileMocksBuild,
  profileRow,
  USER_ID,
} from '#/profile/application/profile-test-support.ts';

describe('profileUpdate', () => {
  it('fails with ENotFound when the account is gone', async (): Promise<void> => {
    const mocks = profileMocksBuild(null);

    const error = await Effect.runPromise(
      profileUpdate(USER_ID, { name: 'New' }).pipe(
        Effect.provide(profileLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('patches only the given fields and records which ones changed', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow);
    const input = { name: 'New', extension: { bio: 'Hello', skills: ['ts'] } };

    const result = await Effect.runPromise(
      profileUpdate(USER_ID, input).pipe(
        Effect.provide(profileLayerBuild(mocks))
      )
    );

    expect(result.extension.skills).toEqual([]);
    expect(mocks.update).toHaveBeenCalledWith(USER_ID, input);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ACTIVITY_ACTION.PROFILE_UPDATE,
        metadata: { [ACTIVITY_DETAIL.CHANGED_FIELDS]: 'name, bio, skills' },
      })
    );
  });

  it('records nothing for an empty patch', async (): Promise<void> => {
    const mocks = profileMocksBuild(profileRow);

    await Effect.runPromise(
      profileUpdate(USER_ID, {}).pipe(Effect.provide(profileLayerBuild(mocks)))
    );

    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
