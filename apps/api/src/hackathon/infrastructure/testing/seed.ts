import { A } from '@mobily/ts-belt';
import { Effect, Layer } from 'effect';
import type { TDomainError } from '#/shared/errors.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { hackathonRepoLayer } from '#/hackathon/infrastructure/hackathon-layer.ts';
import {
  memoryDbCreate,
  type TMemoryDb,
} from '#/hackathon/infrastructure/testing/memory-db.ts';

const EMAIL_DOMAIN = '@imphnen.test';

export type TRepoServices = Layer.Success<typeof hackathonRepoLayer>;

export type TSeededDb = TMemoryDb & {
  readonly users: readonly string[];
  readonly run: <TValue>(
    effect: Effect.Effect<TValue, TDomainError, TRepoServices>
  ) => Promise<TValue>;
  readonly fail: <TValue>(
    effect: Effect.Effect<TValue, TDomainError, TRepoServices>
  ) => Promise<TDomainError>;
};

export const emailOf = (userId: string): string => `${userId}${EMAIL_DOMAIN}`;

export const seededDbCreate = async (userCount: number): Promise<TSeededDb> => {
  const memory = await memoryDbCreate();
  const users = A.makeWithIndex(userCount, (index) => `user-${index}`);
  await memory.db
    .insert(user)
    .values([...A.map(users, (id) => ({ id, name: id, email: emailOf(id) }))]);
  const layer = hackathonRepoLayer.pipe(Layer.provide(memory.layer));
  return {
    ...memory,
    users,
    run: (effect) => Effect.runPromise(effect.pipe(Effect.provide(layer))),
    fail: (effect) =>
      Effect.runPromise(effect.pipe(Effect.flip, Effect.provide(layer))),
  };
};
