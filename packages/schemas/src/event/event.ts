import { z } from 'zod';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

export const EVENT_NAME_MAX_LENGTH = 200;
export const EVENT_DESCRIPTION_MAX_LENGTH = 5000;
export const EVENT_LOCATION_MAX_LENGTH = 300;

export const eventDateInputSchema = z.union([
  z.iso.datetime({ offset: true }),
  z.iso.date(),
]);
export type TEventDateInput = z.infer<typeof eventDateInputSchema>;

export const eventItemSchema = baseSchema(z.uuid()).extend({
  name: z.string(),
  description: z.string(),
  detailLink: z.string(),
  price: z.number().int().min(0),
  isOnline: z.boolean(),
  location: z.string().nullable(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
});
export type TEvent = TEntityOf<z.infer<typeof eventItemSchema>>;

const eventWriteFields = {
  name: z.string().trim().min(1).max(EVENT_NAME_MAX_LENGTH),
  description: z.string().trim().min(1).max(EVENT_DESCRIPTION_MAX_LENGTH),
  detailLink: z.url(),
  price: z.number().int().min(0),
  isOnline: z.boolean(),
  location: z
    .string()
    .trim()
    .max(EVENT_LOCATION_MAX_LENGTH)
    .nullable()
    .default(null),
  startDate: eventDateInputSchema,
  endDate: eventDateInputSchema,
};

export const eventCreateInputSchema = z.object(eventWriteFields);
export type TEventCreateInput = z.infer<typeof eventCreateInputSchema>;

export const eventUpdateInputSchema = z.object({
  id: z.uuid(),
  ...eventWriteFields,
});
export type TEventUpdateInput = z.infer<typeof eventUpdateInputSchema>;

export const eventIdInputSchema = z.object({ id: z.uuid() });
export type TEventIdInput = z.infer<typeof eventIdInputSchema>;

export const EVENT_SORT = {
  NAME: 'name',
  START_DATE: 'startDate',
  CREATED_AT: 'createdAt',
} as const;

export type TEventSort = (typeof EVENT_SORT)[keyof typeof EVENT_SORT];

export const eventListInputSchema = paginationSchema.extend({
  search: searchQuerySchema.optional(),
  sortBy: z
    .enum([EVENT_SORT.NAME, EVENT_SORT.START_DATE, EVENT_SORT.CREATED_AT])
    .default(EVENT_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TEventListInput = z.infer<typeof eventListInputSchema>;

export const eventListSchema = paginated(eventItemSchema);
export type TEventList = z.infer<typeof eventListSchema>;
