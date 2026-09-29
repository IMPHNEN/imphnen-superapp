import { activitySchema, type TActivity } from '@app/schemas';
import type { TActivityRow } from '#/activity/domain/activity.ts';

export const toActivityDto = (row: TActivityRow): TActivity =>
  activitySchema.parse({
    id: row.id,
    actorId: row.actorId,
    actorEmail: row.actorEmail,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
  });
