import type {
  TMentoringListMineInput,
  TMentoringSessionList,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toSessionDto } from '#/mentoring/application/to-session-dto.ts';
import {
  MentoringSessionRepo,
  type TMentoringSessionRepoId,
} from '#/mentoring/domain/mentoring-session.ts';
import type { EDatabase } from '#/shared/errors.ts';

export const mentoringListMine = Effect.fn('mentoringListMine')(function* (
  input: TMentoringListMineInput,
  userId: string
): Effect.fn.Return<TMentoringSessionList, EDatabase, TMentoringSessionRepoId> {
  const sessionRepo = yield* MentoringSessionRepo;
  const { items, total } = yield* sessionRepo.listFor(input, userId);
  return {
    items: A.map(items, toSessionDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
