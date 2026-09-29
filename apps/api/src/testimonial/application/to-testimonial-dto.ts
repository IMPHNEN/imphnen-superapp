import { type TTestimonial, testimonialSchema } from '@app/schemas';
import type { TTestimonialView } from '#/testimonial/domain/testimonial.ts';

const NO_AUTHOR_NAME = '';

export const toTestimonialDto = (view: TTestimonialView): TTestimonial =>
  testimonialSchema.parse({
    id: view.id,
    authorId: view.userId,
    authorName: view.authorName ?? NO_AUTHOR_NAME,
    authorImage: view.authorImage,
    role: view.role,
    content: view.content,
    status: view.status,
    approvedAt: view.approvedAt?.toISOString() ?? null,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
  });
