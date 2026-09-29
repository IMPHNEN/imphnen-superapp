import { A } from '@mobily/ts-belt';
import { and, asc, desc, eq, gt, lt, or, type SQL } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { match, P } from 'ts-pattern';
import { EDatabase } from '#/shared/errors.ts';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { hackathonMessage } from '#/platform/db/tables/hackathon.ts';
import {
  MESSAGE_DIRECTION,
  MessageRepo,
  type TMessageCursor,
  type TMessageDirection,
  type TMessageRepo,
} from '#/hackathon/domain/message-repo.ts';
import type { TMessageRow } from '#/hackathon/domain/hackathon-rows.ts';
import { personFields } from '#/hackathon/infrastructure/hackathon-sql.ts';

const messagesWhere = (
  db: TDb,
  where: SQL | undefined,
  order: readonly SQL[],
  limit: number
): Promise<TMessageRow[]> =>
  db
    .select({
      id: hackathonMessage.id,
      teamId: hackathonMessage.teamId,
      author: personFields,
      body: hackathonMessage.body,
      createdAt: hackathonMessage.createdAt,
    })
    .from(hackathonMessage)
    .innerJoin(user, eq(user.id, hackathonMessage.userId))
    .where(where)
    .orderBy(...order)
    .limit(limit);

const cursorWhere = (
  direction: TMessageDirection,
  cursor: TMessageCursor | null
): SQL | undefined =>
  match({ direction, cursor })
    .with({ cursor: P.nullish }, () => undefined)
    .with(
      { direction: MESSAGE_DIRECTION.OLDER, cursor: P.nonNullable },
      ({ cursor: found }) =>
        or(
          lt(hackathonMessage.createdAt, found.createdAt),
          and(
            eq(hackathonMessage.createdAt, found.createdAt),
            lt(hackathonMessage.id, found.id)
          )
        )
    )
    .with(
      { direction: MESSAGE_DIRECTION.NEWER, cursor: P.nonNullable },
      ({ cursor: found }) =>
        or(
          gt(hackathonMessage.createdAt, found.createdAt),
          and(
            eq(hackathonMessage.createdAt, found.createdAt),
            gt(hackathonMessage.id, found.id)
          )
        )
    )
    .exhaustive();

const orderFor = (direction: TMessageDirection): readonly SQL[] =>
  match(direction)
    .with(MESSAGE_DIRECTION.OLDER, () => [
      desc(hackathonMessage.createdAt),
      desc(hackathonMessage.id),
    ])
    .with(MESSAGE_DIRECTION.NEWER, () => [
      asc(hackathonMessage.createdAt),
      asc(hackathonMessage.id),
    ])
    .exhaustive();

const chronological = (
  direction: TMessageDirection,
  rows: readonly TMessageRow[]
): readonly TMessageRow[] =>
  match(direction)
    .with(MESSAGE_DIRECTION.OLDER, () => A.reverse(rows))
    .with(MESSAGE_DIRECTION.NEWER, () => rows)
    .exhaustive();

export const messageRepoLayer = Layer.effect(
  MessageRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const list: TMessageRepo['list'] = (query) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await messagesWhere(
            db,
            and(
              eq(hackathonMessage.teamId, query.teamId),
              cursorWhere(query.direction, query.cursor)
            ),
            orderFor(query.direction),
            query.limit + 1
          );
          return {
            items: chronological(query.direction, A.take(rows, query.limit)),
            hasMore: A.length(rows) > query.limit,
          };
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const find: TMessageRepo['find'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await messagesWhere(
            db,
            eq(hackathonMessage.id, id),
            [],
            1
          );
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const create: TMessageRepo['create'] = (draft) =>
      Effect.tryPromise({
        try: async () => {
          const id = crypto.randomUUID();
          await db.insert(hackathonMessage).values({ ...draft, id });
          const [row] = await messagesWhere(
            db,
            eq(hackathonMessage.id, id),
            [],
            1
          );
          return row as TMessageRow;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const remove: TMessageRepo['remove'] = (id) =>
      Effect.tryPromise({
        try: async () => {
          const rows = await db
            .delete(hackathonMessage)
            .where(eq(hackathonMessage.id, id))
            .returning({ id: hackathonMessage.id });
          return rows.length > 0;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return MessageRepo.of({ list, find, create, remove });
  })
);
