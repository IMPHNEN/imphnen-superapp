import { ACTIVITY_ACTION } from '@app/activity';
import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import { mentorDelete } from '#/mentor/application/mentor-delete.ts';
import {
  ACTOR_ID,
  MENTOR_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { ENotFound } from '#/shared/errors.ts';

describe('mentorDelete', () => {
  it('soft deletes and records the activity', async (): Promise<void> => {
    const mocks = mentorMocksBuild(mentorRowBuild());

    const result = await Effect.runPromise(
      mentorDelete({ id: MENTOR_ID }, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(result).toEqual({ id: MENTOR_ID });
    expect(mocks.remove).toHaveBeenCalledWith(MENTOR_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.MENTOR_DELETE })
    );
  });

  it('fails with ENotFound for an already deleted mentor', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);

    const error = await Effect.runPromise(
      mentorDelete({ id: MENTOR_ID }, ACTOR_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
