import { canAll, PERMISSION, type TPermission } from '@app/permissions';
import type { TSessionActor } from '#/mentoring/domain/session-actor.ts';

export const sessionActorOf = (
  userId: string,
  permissions: readonly TPermission[]
): TSessionActor => ({
  userId,
  canManage: canAll(permissions, [PERMISSION.MENTORING_SESSION_MANAGE]),
});
