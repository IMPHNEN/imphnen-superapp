import type { TMentorListInput, TMentorPublicList } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toMentorPublicDto } from '#/mentor/application/to-mentor-dto.ts';
import { MentorRepo, type TMentorRepoId } from '#/mentor/domain/mentor.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentorList = Effect.fn('mentorList')(function* (
  input: TMentorListInput
): Effect.fn.Return<TMentorPublicList, EDatabase, TMentorRepoId> {
  const mentorRepo = yield* MentorRepo;
  const { items, total } = yield* mentorRepo.publicList(input);
  return {
    items: A.map(items, toMentorPublicDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
