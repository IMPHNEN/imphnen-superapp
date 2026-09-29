import type {
  THackathonAdminListInput,
  THackathonAdminParticipantList,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import { AdminRepo, type TAdminRepoId } from '#/hackathon/domain/admin-repo.ts';
import { toAdminParticipantDto } from '#/hackathon/application/to-award-dto.ts';

export const adminParticipantList = Effect.fn('adminParticipantList')(
  function* (
    input: THackathonAdminListInput
  ): Effect.fn.Return<
    THackathonAdminParticipantList,
    EDatabase,
    TAdminRepoId | TStorageServiceId
  > {
    const adminRepo = yield* AdminRepo;
    const { publicUrlOf } = yield* StorageService;
    const { items, total } = yield* adminRepo.participants(input);

    return {
      items: A.map(items, (row) => toAdminParticipantDto(row, publicUrlOf)),
      total,
      page: input.page,
      pageSize: input.pageSize,
    };
  }
);
