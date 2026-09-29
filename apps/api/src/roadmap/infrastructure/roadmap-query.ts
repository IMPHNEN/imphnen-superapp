import {
  ROADMAP_SORT,
  SORT_DIRECTION,
  type TRoadmapListInput,
} from '@app/schemas';
import {
  type AnyColumn,
  and,
  asc,
  desc,
  eq,
  getTableName,
  isNull,
  type SQL,
  sql,
  type Table,
} from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import { containsWhere } from '#/platform/db/search.ts';
import { roadmapItem, roadmapVote } from '#/platform/db/tables/roadmap.ts';
import { orderFor } from '#/shared/pagination.ts';

const NO_VIEWER = '';

const qualified = (table: Table, column: AnyColumn): SQL =>
  sql`${sql.identifier(getTableName(table))}.${sql.identifier(column.name)}`;

const itemId = qualified(roadmapItem, roadmapItem.id);
const voteItemId = qualified(roadmapVote, roadmapVote.itemId);
const voteUserId = qualified(roadmapVote, roadmapVote.userId);
const legacyVotes = qualified(roadmapItem, roadmapItem.legacyVotes);

export const roadmapVotesSql: SQL<number> = sql<number>`(${legacyVotes} + (select count(*) from ${roadmapVote} where ${voteItemId} = ${itemId}))`;

const votedByMeSql = (viewerId: string | null): SQL<boolean> =>
  sql`exists(select 1 from ${roadmapVote} where ${voteItemId} = ${itemId} and ${voteUserId} = ${viewerId ?? NO_VIEWER})`.mapWith(
    (value: unknown): boolean => value === 1 || value === true
  );

type TRoadmapColumns = {
  id: typeof roadmapItem.id;
  title: typeof roadmapItem.title;
  description: typeof roadmapItem.description;
  status: typeof roadmapItem.status;
  createdAt: typeof roadmapItem.createdAt;
  updatedAt: typeof roadmapItem.updatedAt;
  votes: SQL<number>;
  votedByMe: SQL<boolean>;
};

export const roadmapColumns = (viewerId: string | null): TRoadmapColumns => ({
  id: roadmapItem.id,
  title: roadmapItem.title,
  description: roadmapItem.description,
  status: roadmapItem.status,
  createdAt: roadmapItem.createdAt,
  updatedAt: roadmapItem.updatedAt,
  votes: roadmapVotesSql.mapWith(Number),
  votedByMe: votedByMeSql(viewerId),
});

export const roadmapLiveWhere = isNull(roadmapItem.deletedAt);

export const roadmapLiveByIdWhere = (id: string): SQL | undefined =>
  and(eq(roadmapItem.id, id), roadmapLiveWhere);

export const roadmapListWhere = (input: TRoadmapListInput): SQL | undefined =>
  and(
    roadmapLiveWhere,
    match(input.search)
      .with(P.nonNullable, (search) => containsWhere(roadmapItem.title, search))
      .otherwise(() => undefined),
    match(input.status)
      .with(P.nonNullable, (status) => eq(roadmapItem.status, status))
      .otherwise(() => undefined)
  );

export const roadmapOrder = (input: TRoadmapListInput): SQL =>
  match(input.sortBy)
    .with(ROADMAP_SORT.TITLE, () => orderFor(roadmapItem.title, input.sortDir))
    .with(ROADMAP_SORT.CREATED_AT, () =>
      orderFor(roadmapItem.createdAt, input.sortDir)
    )
    .with(ROADMAP_SORT.VOTES, () =>
      match(input.sortDir)
        .with(SORT_DIRECTION.ASC, () => asc(roadmapVotesSql))
        .with(SORT_DIRECTION.DESC, () => desc(roadmapVotesSql))
        .exhaustive()
    )
    .exhaustive();
