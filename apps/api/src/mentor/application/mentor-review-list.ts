import type { TMentorPrivateList, TMentorReviewListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toMentorPrivateDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentorReviewList = Effect.fn('mentorReviewList')(function* (
  input: TMentorReviewListInput
): Effect.fn.Return<TMentorPrivateList, EDatabase, TMentorRepoId> {
  const mentorRepo = yield* MentorRepo;
  const { items, total } = yield* mentorRepo.reviewList(input);
  return {
    items: A.map(items, toMentorPrivateDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
