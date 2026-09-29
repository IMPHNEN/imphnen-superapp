import { MENTOR_MESSAGE } from '@app/messages';
import type { TMentorIdInput, TMentorPrivate } from '@app/schemas';
import { Effect } from 'effect';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import { type EDatabase, ENotFound } from '#/shared/errors.ts';

export const mentorReviewGet = Effect.fn('mentorReviewGet')(function* ({
  id,
}: TMentorIdInput): Effect.fn.Return<
  TMentorPrivate,
  ENotFound | EDatabase,
  TMentorRepoId
> {
  const mentorRepo = yield* MentorRepo;
  const row = yield* mentorRepo.findById(id);

  if (row === null) {
    return yield* new ENotFound({ message: MENTOR_MESSAGE.NOT_FOUND });
  }

  return toMentorPrivateDto(row);
});
