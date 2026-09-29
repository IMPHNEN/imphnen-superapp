import { MENTOR_MESSAGE } from '@app/messages';
import type {
  TMentoringAvailability,
  TMentoringAvailabilityInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Clock, Effect } from 'effect';
import {
  MentorRepo,
  mentorIsPublic,
  type TMentorRepoId,
} from '#/mentor/index.ts';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import {
  AVAILABILITY_WINDOW_DAYS,
  DAY_MS,
} from '#/mentoring/domain/mentoring-schedule.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentoringAvailability = Effect.fn('mentoringAvailability')(
  function* ({
    mentorUserId,
  }: TMentoringAvailabilityInput): Effect.fn.Return<
    TMentoringAvailability,
    ENotFound | EDatabase,
    TMentorRepoId | TMentoringSessionRepoId
  > {
    const mentorRepo = yield* MentorRepo;
    const sessionRepo = yield* MentoringSessionRepo;

    const mentor = yield* mentorRepo.findByUserId(mentorUserId);

    if (mentor === null || !mentorIsPublic(mentor.status)) {
      return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
    }

    const now = yield* Clock.currentTimeMillis;
    const windowStart = new Date(now);
    const windowEnd = new Date(now + AVAILABILITY_WINDOW_DAYS * DAY_MS);
    const busy = yield* sessionRepo.busy(mentorUserId, windowStart, windowEnd);

    return {
      mentorId: mentor.id,
      mentorUserId,
      availabilityCommitment: mentor.availabilityCommitment,
      preferredMentoringFormats: [...mentor.preferredMentoringFormats],
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      busy: [
        ...A.map(busy, (slot) => ({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
        })),
      ],
    };
  }
);
