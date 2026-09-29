import { ROLE } from '@app/permissions';
import type { TRoleList } from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import { Effect } from 'effect';
import { fixedRoleDto, toRoleDto } from '#/role/application/to-role-dto.ts';
import type { EDatabase } from '#/shared/errors.ts';
import {
  CustomRoleRepo,
  type TCustomRoleRepoId,
} from '#/role/domain/custom-role.ts';

export const roleList = Effect.fn('roleList')(function* (): Effect.fn.Return<
  TRoleList,
  EDatabase,
  TCustomRoleRepoId
> {
  const customRoleRepo = yield* CustomRoleRepo;

  const [custom, counts] = yield* Effect.all([
    customRoleRepo.list(),
    customRoleRepo.memberCounts(),
  ]);

  const fixed = A.map(D.values(ROLE), (key) => fixedRoleDto(key, counts));
  const items = A.map(custom, (row) => toRoleDto(row, counts));

  return { items: [...fixed, ...items] };
});
