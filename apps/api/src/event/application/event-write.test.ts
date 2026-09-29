import { ACTIVITY_ACTION } from '@app/activity';
import type { TEventCreateInput } from '@app/schemas';
import { Effect, Layer } from 'effect';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { eventCreate } from '#/event/application/event-create.ts';
import { eventDelete } from '#/event/application/event-delete.ts';
import { eventUpdate } from '#/event/application/event-update.ts';
import {
  EventRepo,
  type TEventRepoId,
  type TEventRow,
} from '#/event/domain/event.ts';
import {
  ActivityRecorder,
  type TActivityRecorderId,
} from '#/shared/activity-recorder.ts';
import { EBadRequest, ENotFound } from '#/shared/errors.ts';

const ACTOR_ID = '22222222-2222-4222-8222-222222222222';
const EVENT_ID = '11111111-1111-4111-8111-111111111111';

const input: TEventCreateInput = {
  name: 'Ngoding Bareng',
  description: 'Meetup',
  detailLink: 'https://imphnen.dev/events/1',
  price: 150000,
  isOnline: false,
  location: 'Jakarta',
  startDate: '2025-09-20',
  endDate: '2025-09-20',
};

const row: TEventRow = {
  id: EVENT_ID,
  name: input.name,
  description: input.description,
  detailLink: input.detailLink,
  price: input.price,
  isOnline: input.isOnline,
  location: input.location,
  startDate: new Date('2025-09-19T17:00:00.000Z'),
  endDate: new Date('2025-09-20T16:59:59.999Z'),
  deletedAt: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
};

type TMocks = { create: Mock; update: Mock; softDelete: Mock; insert: Mock };

const mocksBuild = (stored: TEventRow | null): TMocks => ({
  create: vi.fn().mockReturnValue(Effect.succeed(row)),
  update: vi.fn().mockReturnValue(Effect.succeed(stored)),
  softDelete: vi.fn().mockReturnValue(Effect.succeed(stored)),
  insert: vi.fn().mockReturnValue(Effect.succeed(undefined)),
});

const layerBuild = (
  mocks: TMocks
): Layer.Layer<TEventRepoId | TActivityRecorderId> =>
  Layer.mergeAll(
    Layer.succeed(
      EventRepo,
      EventRepo.of({
        list: vi.fn(),
        findById: vi.fn(),
        create: mocks.create,
        update: mocks.update,
        softDelete: mocks.softDelete,
      })
    ),
    Layer.succeed(
      ActivityRecorder,
      ActivityRecorder.of({ insert: mocks.insert })
    )
  );

describe('eventCreate', () => {
  it('stores date-only input as whole Jakarta days and logs the activity', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const result = await Effect.runPromise(
      eventCreate(input, ACTOR_ID).pipe(Effect.provide(layerBuild(mocks)))
    );

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: row.startDate,
        endDate: row.endDate,
      })
    );
    expect(result.startDate).toBe(row.startDate.toISOString());
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.EVENT_CREATE })
    );
  });

  it('refuses an event that ends before it starts', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      eventCreate(
        { ...input, startDate: '2025-09-21', endDate: '2025-09-20' },
        ACTOR_ID
      ).pipe(Effect.provide(layerBuild(mocks)), Effect.flip)
    );

    expect(error).toBeInstanceOf(EBadRequest);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe('eventUpdate', () => {
  it('fails with ENotFound when the event is missing or deleted', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      eventUpdate({ ...input, id: EVENT_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe('eventDelete', () => {
  it('fails with ENotFound on an event that is already deleted', async (): Promise<void> => {
    const mocks = mocksBuild(null);

    const error = await Effect.runPromise(
      eventDelete({ id: EVENT_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks)),
        Effect.flip
      )
    );

    expect(error).toBeInstanceOf(ENotFound);
  });

  it('soft deletes the event and logs the activity', async (): Promise<void> => {
    const mocks = mocksBuild(row);

    const result = await Effect.runPromise(
      eventDelete({ id: EVENT_ID }, ACTOR_ID).pipe(
        Effect.provide(layerBuild(mocks))
      )
    );

    expect(result).toEqual({ id: EVENT_ID });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ action: ACTIVITY_ACTION.EVENT_DELETE })
    );
  });
});
