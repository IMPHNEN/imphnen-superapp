import type { THackathonJoinRequestList } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepoId,
} from '#/hackathon/domain/join-request-repo.ts';
import { toJoinRequestDto } from '#/hackathon/application/to-activity-dto.ts';

export const joinRequestMine = Effect.fn('joinRequestMine')(function* (
  userId: string
): Effect.fn.Return<
  THackathonJoinRequestList,
  EDatabase,
  TJoinRequestRepoId | TStorageServiceId
> {
  const joinRequestRepo = yield* JoinRequestRepo;
  const { publicUrlOf } = yield* StorageService;
  const rows = yield* joinRequestRepo.listByUser(userId);

  return { items: A.map(rows, (row) => toJoinRequestDto(row, publicUrlOf)) };
});
