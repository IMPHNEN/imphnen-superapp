import { z } from 'zod';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

export const ROADMAP_TITLE_MAX_LENGTH = 200;
export const ROADMAP_DESCRIPTION_MAX_LENGTH = 5000;

export const ROADMAP_STATUS = {
  UPCOMING: 'upcoming',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
} as const;

export type TRoadmapStatus =
  (typeof ROADMAP_STATUS)[keyof typeof ROADMAP_STATUS];

export const roadmapStatusSchema = z.enum([
  ROADMAP_STATUS.UPCOMING,
  ROADMAP_STATUS.IN_PROGRESS,
  ROADMAP_STATUS.COMPLETED,
]);

export const roadmapItemSchema = baseSchema(z.uuid()).extend({
  title: z.string(),
  description: z.string(),
  status: roadmapStatusSchema,
  votes: z.number().int().min(0),
  votedByMe: z.boolean(),
});
export type TRoadmapItem = TEntityOf<z.infer<typeof roadmapItemSchema>>;

const roadmapWriteFields = {
  title: z.string().trim().min(1).max(ROADMAP_TITLE_MAX_LENGTH),
  description: z.string().trim().min(1).max(ROADMAP_DESCRIPTION_MAX_LENGTH),
  status: roadmapStatusSchema.default(ROADMAP_STATUS.UPCOMING),
};

export const roadmapCreateInputSchema = z.object(roadmapWriteFields);
export type TRoadmapCreateInput = z.infer<typeof roadmapCreateInputSchema>;

export const roadmapUpdateInputSchema = z.object({
  id: z.uuid(),
  ...roadmapWriteFields,
});
export type TRoadmapUpdateInput = z.infer<typeof roadmapUpdateInputSchema>;

export const roadmapIdInputSchema = z.object({ id: z.uuid() });
export type TRoadmapIdInput = z.infer<typeof roadmapIdInputSchema>;

export const roadmapVoteInputSchema = z.object({
  id: z.uuid(),
  voted: z.boolean(),
});
export type TRoadmapVoteInput = z.infer<typeof roadmapVoteInputSchema>;

export const roadmapVoteSchema = z.object({
  id: z.uuid(),
  votes: z.number().int().min(0),
  votedByMe: z.boolean(),
});
export type TRoadmapVote = z.infer<typeof roadmapVoteSchema>;

export const ROADMAP_SORT = {
  TITLE: 'title',
  VOTES: 'votes',
  CREATED_AT: 'createdAt',
} as const;

export type TRoadmapSort = (typeof ROADMAP_SORT)[keyof typeof ROADMAP_SORT];

export const roadmapListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  status: roadmapStatusSchema.optional(),
  sortBy: z
    .enum([ROADMAP_SORT.TITLE, ROADMAP_SORT.VOTES, ROADMAP_SORT.CREATED_AT])
    .default(ROADMAP_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TRoadmapListInput = z.infer<typeof roadmapListInputSchema>;

export const roadmapListSchema = paginated(roadmapItemSchema);
export type TRoadmapList = z.infer<typeof roadmapListSchema>;
