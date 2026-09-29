import { canAll, PERMISSION } from '@app/permissions';
import type { TORPCContext } from '#/platform/orpc/context.ts';
import type { THackathonViewer } from '#/hackathon/domain/viewer.ts';

export const viewerOf = (context: TORPCContext): THackathonViewer => ({
  userId: context.session?.user.id ?? null,
  canManage: canAll(context.permissions, [PERMISSION.HACKATHON_MANAGE]),
});
