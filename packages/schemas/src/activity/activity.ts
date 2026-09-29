import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';
import { z } from 'zod';
import { eventSchema, type TEventOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

const activityMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const activityMetadataSchema = z.record(
  z.string(),
  activityMetadataValueSchema
);
export type TActivityMetadata = z.infer<typeof activityMetadataSchema>;

export const activitySchema = eventSchema(z.uuid()).extend({
  actorId: z.string().nullable(),
  actorEmail: z.email().nullable(),
  action: z.enum(ACTIVITY_ACTION),
  resourceType: z.enum(ACTIVITY_RESOURCE_TYPE),
  resourceId: z.string(),
  metadata: activityMetadataSchema.nullable(),
});
export type TActivity = TEventOf<z.infer<typeof activitySchema>>;

export const ACTIVITY_SORT = {
  CREATED_AT: 'createdAt',
  ACTION: 'action',
  RESOURCE_TYPE: 'resourceType',
} as const;

export type TActivitySort = (typeof ACTIVITY_SORT)[keyof typeof ACTIVITY_SORT];

export const activityListInputSchema = paginationSchema.extend({
  action: z.string().optional(),
  resourceType: z.string().optional(),
  actorId: z.string().optional(),
  sortBy: z
    .enum([
      ACTIVITY_SORT.CREATED_AT,
      ACTIVITY_SORT.ACTION,
      ACTIVITY_SORT.RESOURCE_TYPE,
    ])
    .default(ACTIVITY_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TActivityListInput = z.infer<typeof activityListInputSchema>;

export const activityListSchema = paginated(activitySchema);
export type TActivityList = z.infer<typeof activityListSchema>;
