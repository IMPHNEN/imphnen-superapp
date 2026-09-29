import type { THackathonWinnerList } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  type TWinnerRepoId,
  WinnerRepo,
} from '#/hackathon/domain/award-repo.ts';
import { toWinnerDto } from '#/hackathon/application/to-award-dto.ts';

export const winnerList = Effect.fn('winnerList')(
  function* (): Effect.fn.Return<
    THackathonWinnerList,
    EDatabase,
    TWinnerRepoId | TStorageServiceId
  > {
    const winnerRepo = yield* WinnerRepo;
    const { publicUrlOf } = yield* StorageService;
    const rows = yield* winnerRepo.list();

    return { items: A.map(rows, (row) => toWinnerDto(row, publicUrlOf)) };
  }
);
