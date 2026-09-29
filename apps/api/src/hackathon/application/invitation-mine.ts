import type { THackathonInvitationList } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  InvitationRepo,
  type TInvitationRepoId,
} from '#/hackathon/domain/invitation-repo.ts';
import { toInvitationDto } from '#/hackathon/application/to-activity-dto.ts';

export const invitationMine = Effect.fn('invitationMine')(function* (
  email: string
): Effect.fn.Return<
  THackathonInvitationList,
  EDatabase,
  TInvitationRepoId | TStorageServiceId
> {
  const invitationRepo = yield* InvitationRepo;
  const { publicUrlOf } = yield* StorageService;
  const rows = yield* invitationRepo.listPending(email.toLowerCase());

  return { items: A.map(rows, (row) => toInvitationDto(row, publicUrlOf)) };
});
