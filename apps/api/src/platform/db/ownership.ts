import { ROLE } from '@app/permissions';
import { eq, type AnyColumn, type SQL } from 'drizzle-orm';
import { match } from 'ts-pattern';
import type { TOwnershipActor } from '#/shared/authorization/owned-entity.ts';

export const ownershipWhere = (
  actor: TOwnershipActor,
  authorId: AnyColumn<{ data: string }>
): SQL | undefined =>
  match(actor.role)
    .with(ROLE.SUPERADMIN, () => undefined)
    .otherwise(() => eq(authorId, actor.id));
