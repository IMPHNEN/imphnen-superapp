import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated, paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';

export const TESTIMONIAL_ROLE_MAX_LENGTH = 100;
export const TESTIMONIAL_CONTENT_MAX_LENGTH = 1000;

export const TESTIMONIAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type TTestimonialStatus =
  (typeof TESTIMONIAL_STATUS)[keyof typeof TESTIMONIAL_STATUS];

export const testimonialStatusSchema = z.enum([
  TESTIMONIAL_STATUS.PENDING,
  TESTIMONIAL_STATUS.APPROVED,
  TESTIMONIAL_STATUS.REJECTED,
]);

export const testimonialSchema = baseSchema(z.uuid()).extend({
  authorId: userIdSchema,
  authorName: z.string(),
  authorImage: z.string().nullable(),
  role: z.string(),
  content: z.string(),
  status: testimonialStatusSchema,
  approvedAt: z.iso.datetime().nullable(),
});
export type TTestimonial = TEntityOf<z.infer<typeof testimonialSchema>>;

const testimonialWriteFields = {
  role: z.string().trim().min(1).max(TESTIMONIAL_ROLE_MAX_LENGTH),
  content: z.string().trim().min(1).max(TESTIMONIAL_CONTENT_MAX_LENGTH),
};

export const testimonialCreateInputSchema = z.object(testimonialWriteFields);
export type TTestimonialCreateInput = z.infer<
  typeof testimonialCreateInputSchema
>;

export const testimonialUpdateInputSchema = z.object({
  id: z.uuid(),
  ...testimonialWriteFields,
});
export type TTestimonialUpdateInput = z.infer<
  typeof testimonialUpdateInputSchema
>;

export const testimonialIdInputSchema = z.object({ id: z.uuid() });
export type TTestimonialIdInput = z.infer<typeof testimonialIdInputSchema>;

export const testimonialModerateInputSchema = z.object({
  id: z.uuid(),
  status: testimonialStatusSchema,
});
export type TTestimonialModerateInput = z.infer<
  typeof testimonialModerateInputSchema
>;

export const TESTIMONIAL_SORT = {
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
} as const;

export type TTestimonialSort =
  (typeof TESTIMONIAL_SORT)[keyof typeof TESTIMONIAL_SORT];

export const testimonialListInputSchema = paginationSchema.extend({
  sortBy: z
    .enum([TESTIMONIAL_SORT.CREATED_AT, TESTIMONIAL_SORT.UPDATED_AT])
    .default(TESTIMONIAL_SORT.CREATED_AT),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});
export type TTestimonialListInput = z.infer<typeof testimonialListInputSchema>;

export const testimonialModerationListInputSchema =
  testimonialListInputSchema.extend({
    status: testimonialStatusSchema.optional(),
    search: searchQuerySchema.optional(),
  });
export type TTestimonialModerationListInput = z.infer<
  typeof testimonialModerationListInputSchema
>;

export const testimonialListSchema = paginated(testimonialSchema);
export type TTestimonialList = z.infer<typeof testimonialListSchema>;
