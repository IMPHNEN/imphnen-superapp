import type { TActivityList, TActivityListInput } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { toActivityDto } from '#/activity/application/to-activity-dto.ts';
import type { EDatabase } from '#/shared/errors.ts';
import {
  ActivityRepo,
  type TActivityRepoId,
} from '#/activity/domain/activity.ts';

export const activityList = Effect.fn('activityList')(function* (
  input: TActivityListInput
): Effect.fn.Return<TActivityList, EDatabase, TActivityRepoId> {
  const activityRepo = yield* ActivityRepo;
  const { items, total } = yield* activityRepo.list(input);
  return {
    items: A.map(items, toActivityDto),
    total,
    page: input.page,
    pageSize: input.pageSize,
  };
});
