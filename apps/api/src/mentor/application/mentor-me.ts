import type { TMentorMe } from '@app/schemas';
import { Effect } from 'effect';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentorMe = Effect.fn('mentorMe')(function* (
  userId: string
): Effect.fn.Return<TMentorMe, EDatabase, TMentorRepoId> {
  const mentorRepo = yield* MentorRepo;
  const row = yield* mentorRepo.findByUserId(userId);
  return row === null ? null : toMentorPrivateDto(row);
});
