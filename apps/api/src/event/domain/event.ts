import type { TEventCreateInput, TEventListInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TEventRow = TBaseRow & {
  name: string;
  description: string;
  detailLink: string;
  price: number;
  isOnline: boolean;
  location: string | null;
  startDate: Date;
  endDate: Date;
  deletedAt: Date | null;
};

export type TEventWrite = Omit<TEventCreateInput, 'startDate' | 'endDate'> & {
  startDate: Date;
  endDate: Date;
};

export type TEventRepo = {
  list: (
    input: TEventListInput
  ) => Effect.Effect<TRowPage<TEventRow>, EDatabase>;
  findById: (id: string) => Effect.Effect<TEventRow | null, EDatabase>;
  create: (values: TEventWrite) => Effect.Effect<TEventRow, EDatabase>;
  update: (
    id: string,
    values: TEventWrite
  ) => Effect.Effect<TEventRow | null, EDatabase>;
  softDelete: (id: string) => Effect.Effect<TEventRow | null, EDatabase>;
};

export type TEventRepoId = TServiceId<typeof REPO_TAG.EVENT>;

export const EventRepo = Context.Service<TEventRepoId, TEventRepo>(
  REPO_TAG.EVENT
);
