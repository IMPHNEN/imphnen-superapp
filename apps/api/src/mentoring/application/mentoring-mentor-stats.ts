import type { TMentoringMentorStats } from '@app/schemas';
import { Clock, Effect } from 'effect';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentoringMentorStats = Effect.fn('mentoringMentorStats')(
  function* (
    mentorUserId: string
  ): Effect.fn.Return<
    TMentoringMentorStats,
    EDatabase,
    TMentoringSessionRepoId
  > {
    const sessionRepo = yield* MentoringSessionRepo;
    const now = yield* Clock.currentTimeMillis;
    return yield* sessionRepo.mentorStats(mentorUserId, new Date(now));
  }
);
