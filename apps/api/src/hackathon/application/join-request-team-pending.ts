import type {
  THackathonJoinRequestList,
  THackathonTeamIdInput,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { Effect } from 'effect';
import type { EDatabase, EForbidden, ENotFound } from '#/shared/errors.ts';
import {
  StorageService,
  type TStorageServiceId,
} from '#/platform/storage/storage-service.ts';
import {
  JoinRequestRepo,
  type TJoinRequestRepoId,
} from '#/hackathon/domain/join-request-repo.ts';
import type { TTeamRepoId } from '#/hackathon/domain/team-repo.ts';
import { leaderTeamFind } from '#/hackathon/application/hackathon-guards.ts';
import { toJoinRequestDto } from '#/hackathon/application/to-activity-dto.ts';

export const joinRequestTeamPending = Effect.fn('joinRequestTeamPending')(
  function* (
    { teamId }: THackathonTeamIdInput,
    actorId: string
  ): Effect.fn.Return<
    THackathonJoinRequestList,
    EForbidden | ENotFound | EDatabase,
    TTeamRepoId | TJoinRequestRepoId | TStorageServiceId
  > {
    const joinRequestRepo = yield* JoinRequestRepo;
    const { publicUrlOf } = yield* StorageService;

    yield* leaderTeamFind(teamId, actorId);
    const rows = yield* joinRequestRepo.listPendingByTeam(teamId);

    return {
      items: A.map(rows, (row) => toJoinRequestDto(row, publicUrlOf)),
    };
  }
);
