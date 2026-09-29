import type {
  TTestimonialCreateInput,
  TTestimonialModerationListInput,
  TTestimonialStatus,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TTestimonialRow = TBaseRow & {
  userId: string;
  role: string;
  content: string;
  status: TTestimonialStatus;
  reviewedBy: string | null;
  approvedAt: Date | null;
  deletedAt: Date | null;
};

export type TTestimonialView = TTestimonialRow & {
  authorName: string | null;
  authorImage: string | null;
};

export type TTestimonialListQuery = TTestimonialModerationListInput & {
  authorId?: string;
};

export type TTestimonialOwnerScope = { ownerId: string } | null;

export type TTestimonialRepo = {
  list: (
    query: TTestimonialListQuery
  ) => Effect.Effect<TRowPage<TTestimonialView>, EDatabase>;
  findById: (id: string) => Effect.Effect<TTestimonialView | null, EDatabase>;
  create: (
    input: TTestimonialCreateInput,
    authorId: string
  ) => Effect.Effect<TTestimonialRow, EDatabase>;
  update: (
    id: string,
    input: TTestimonialCreateInput,
    scope: TTestimonialOwnerScope
  ) => Effect.Effect<TTestimonialRow | null, EDatabase>;
  setStatus: (
    id: string,
    status: TTestimonialStatus,
    reviewerId: string
  ) => Effect.Effect<TTestimonialRow | null, EDatabase>;
  softDelete: (
    id: string,
    scope: TTestimonialOwnerScope
  ) => Effect.Effect<TTestimonialRow | null, EDatabase>;
};

export type TTestimonialRepoId = TServiceId<typeof REPO_TAG.TESTIMONIAL>;

export const TestimonialRepo = Context.Service<
  TTestimonialRepoId,
  TTestimonialRepo
>(REPO_TAG.TESTIMONIAL);
