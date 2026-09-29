import { ACTIVITY_ACTION } from '@app/activity';
import {
  MENTOR_STATUS,
  mentorRegisterInputSchema,
  type TMentorRegisterInput,
} from '@app/schemas';
import { Effect } from 'effect';
import { describe, expect, it, vi } from 'vitest';
import { mentorRegister } from '#/mentor/application/mentor-register.ts';
import {
  MENTOR_USER_ID,
  mentorLayerBuild,
  mentorMocksBuild,
  mentorRowBuild,
} from '#/mentor/application/mentor-test-kit.ts';
import { EConflict } from '#/shared/errors.ts';

const input: TMentorRegisterInput = mentorRegisterInputSchema.parse({
  legalName: 'Mentor Legal',
  bio: 'b'.repeat(60),
  industries: ['Software'],
  expertise: ['Rust'],
  languages: ['English'],
  currentCompany: 'Company',
  currentRole: 'Engineer',
  yearsOfExperience: 5,
  topicsOfInterest: ['Backend'],
  preferredMenteeLevel: ['beginner'],
  preferredMentoringFormats: ['online'],
  availabilityCommitment: 'Two hours a week',
  mentoringRate: 100_000,
});

describe('mentorRegister', () => {
  it('creates a pending application for the signed-in user only', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);
    mocks.register.mockReturnValue(Effect.succeed(mentorRowBuild()));

    const result = await Effect.runPromise(
      mentorRegister(input, MENTOR_USER_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(result.status).toBe(MENTOR_STATUS.PENDING);
    expect(mocks.register).toHaveBeenCalledWith(input, MENTOR_USER_ID);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: MENTOR_USER_ID,
        action: ACTIVITY_ACTION.MENTOR_REGISTER,
      })
    );
  });

  it.each([
    MENTOR_STATUS.PENDING,
    MENTOR_STATUS.ACTIVE,
    MENTOR_STATUS.INACTIVE,
  ])(
    'refuses a second application while one is %s',
    async (status): Promise<void> => {
      const mocks = mentorMocksBuild(mentorRowBuild({ status }));

      const error = await Effect.runPromise(
        mentorRegister(input, MENTOR_USER_ID).pipe(
          Effect.provide(mentorLayerBuild(mocks)),
          Effect.flip
        )
      );

      expect(error).toBeInstanceOf(EConflict);
      expect(mocks.register).not.toHaveBeenCalled();
    }
  );

  it('lets a rejected applicant apply again', async (): Promise<void> => {
    const mocks = mentorMocksBuild(
      mentorRowBuild({ status: MENTOR_STATUS.REJECTED })
    );
    mocks.register.mockReturnValue(Effect.succeed(mentorRowBuild()));

    const result = await Effect.runPromise(
      mentorRegister(input, MENTOR_USER_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks))
      )
    );

    expect(result.status).toBe(MENTOR_STATUS.PENDING);
  });

  it('fails with EConflict when a concurrent application won the race', async (): Promise<void> => {
    const mocks = mentorMocksBuild(null);
    mocks.register = vi.fn().mockReturnValue(Effect.succeed(null));

    const error = await Effect.runPromise(
      mentorRegister(input, MENTOR_USER_ID).pipe(
        Effect.provide(mentorLayerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EConflict);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
