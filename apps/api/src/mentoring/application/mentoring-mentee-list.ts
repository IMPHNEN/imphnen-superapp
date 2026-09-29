import type {
  TMentoringMenteeList,
  TMentoringMenteeListInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentoringMenteeList = Effect.fn('mentoringMenteeList')(function* (
  input: TMentoringMenteeListInput,
  mentorUserId: string
): Effect.fn.Return<TMentoringMenteeList, EDatabase, TMentoringSessionRepoId> {
  const sessionRepo = yield* MentoringSessionRepo;
  const { items, total } = yield* sessionRepo.menteeList(input, mentorUserId);
  return {
    items: A.map(items, (row) => ({
      ...row,
      lastSessionAt: row.lastSessionAt.toISOString(),
    })),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
