import { roadmapItemSchema, type TRoadmapItem } from '@app/schemas';
import type { TRoadmapItemRow } from '#/roadmap/domain/roadmap-item.ts';

export const toRoadmapDto = (row: TRoadmapItemRow): TRoadmapItem =>
  roadmapItemSchema.parse({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    votes: row.votes,
    votedByMe: row.votedByMe,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
