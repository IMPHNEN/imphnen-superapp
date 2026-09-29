import { eventItemSchema, type TEvent } from '@app/schemas';
import type { TEventRow } from '#/event/domain/event.ts';

export const toEventDto = (row: TEventRow): TEvent =>
  eventItemSchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    detailLink: row.detailLink,
    price: row.price,
    isOnline: row.isOnline,
    location: row.location,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
