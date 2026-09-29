import { PERMISSION } from '@app/permissions';
import {
  TESTIMONIAL_STATUS,
  type TTestimonialStatus,
  type TTestimonialUpdateInput,
} from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EForbidden } from '#/shared/errors.ts';
import { testimonialDelete } from '#/testimonial/application/testimonial-delete.ts';
import { testimonialUpdate } from '#/testimonial/application/testimonial-update.ts';
import type { TTestimonialActor } from '#/testimonial/domain/testimonial-access.ts';
import {
  TestimonialRepo,
  type TTestimonialRepoId,
  type TTestimonialView,
} from '#/testimonial/domain/testimonial.ts';

const OWNER_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_ID = '33333333-3333-4333-8333-333333333333';
const TESTIMONIAL_ID = '11111111-1111-4111-8111-111111111111';

const input: TTestimonialUpdateInput = {
  id: TESTIMONIAL_ID,
  role: 'Backend Engineer',
  content: 'Komunitas terbaik',
};

const viewOf = (status: TTestimonialStatus): TTestimonialView => ({
  id: TESTIMONIAL_ID,
  userId: OWNER_ID,
  role: 'Engineer',
  content: 'Mantap',
  status,
  reviewedBy: null,
  approvedAt: null,
  deletedAt: null,
  authorName: 'Owner',
  authorImage: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
});

const member = (id: string): TTestimonialActor => ({
  id,
  permissions: [PERMISSION.TESTIMONIAL_CREATE],
});

const moderator: TTestimonialActor = {
  id: OTHER_ID,
  permissions: [PERMISSION.TESTIMONIAL_MODERATE],
};

type TMocks = { findById: Mock; update: Mock; softDelete: Mock };

const mocksBuild = (view: TTestimonialView): TMocks => ({
  findById: vi.fn().mockReturnValue(Effect.succeed(view)),
  update: vi.fn().mockReturnValue(Effect.succeed(view)),
  softDelete: vi.fn().mockReturnValue(Effect.succeed(view)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TTestimonialRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      TestimonialRepo,
      TestimonialRepo.of({
        list: vi.fn(),
        findById: mocks.findById,
        create: vi.fn(),
        update: mocks.update,
        setStatus: vi.fn(),
        softDelete: mocks.softDelete,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({
        insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
      })
    )
  );

describe('testimonialUpdate', () => {
  it("refuses to change another member's testimonial", async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.PENDING));

    const error = await Effect.runPromise(
      testimonialUpdate(input, member(OTHER_ID)).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('refuses an owner edit once the testimonial is approved', async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.APPROVED));

    const error = await Effect.runPromise(
      testimonialUpdate(input, member(OWNER_ID)).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
  });

  it('lets the owner edit a pending testimonial, scoped to the owner in the write', async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.PENDING));

    await Effect.runPromise(
      testimonialUpdate(input, member(OWNER_ID)).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.update).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
      { role: input.role, content: input.content },
      { ownerId: OWNER_ID }
    );
  });

  it('fails when the testimonial was approved between the read and the write', async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.PENDING));
    mocks.update.mockReturnValue(Effect.succeed(null));

    const error = await Effect.runPromise(
      testimonialUpdate(input, member(OWNER_ID)).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
  });

  it('lets a moderator edit any testimonial without an owner scope', async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.APPROVED));

    await Effect.runPromise(
      testimonialUpdate(input, moderator).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(mocks.update).toHaveBeenCalledWith(
      TESTIMONIAL_ID,
      expect.anything(),
      null
    );
  });
});

describe('testimonialDelete', () => {
  it("refuses to delete another member's testimonial", async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.PENDING));

    const error = await Effect.runPromise(
      testimonialDelete({ id: TESTIMONIAL_ID }, member(OTHER_ID)).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(EForbidden);
    expect(mocks.softDelete).not.toHaveBeenCalled();
  });

  it('lets a moderator delete an approved testimonial', async (): Promise<void> => {
    const mocks = mocksBuild(viewOf(TESTIMONIAL_STATUS.APPROVED));

    const result = await Effect.runPromise(
      testimonialDelete({ id: TESTIMONIAL_ID }, moderator).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result).toEqual({ id: TESTIMONIAL_ID });
    expect(mocks.softDelete).toHaveBeenCalledWith(TESTIMONIAL_ID, null);
  });
});
