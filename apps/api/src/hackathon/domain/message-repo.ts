import { Context, type Effect } from 'effect';
import type { EDatabase } from '#/shared/errors.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';
import type { TMessageRow } from '#/hackathon/domain/hackathon-rows.ts';

export const MESSAGE_DIRECTION = {
  OLDER: 'older',
  NEWER: 'newer',
} as const;

export type TMessageDirection =
  (typeof MESSAGE_DIRECTION)[keyof typeof MESSAGE_DIRECTION];

export type TMessageCursor = {
  createdAt: Date;
  id: string;
};

export type TMessageQuery = {
  teamId: string;
  direction: TMessageDirection;
  cursor: TMessageCursor | null;
  limit: number;
};

export type TMessagePage = {
  items: readonly TMessageRow[];
  hasMore: boolean;
};

export type TMessageDraft = {
  teamId: string;
  userId: string;
  body: string;
};

export type TMessageRepo = {
  list: (query: TMessageQuery) => Effect.Effect<TMessagePage, EDatabase>;
  find: (id: string) => Effect.Effect<TMessageRow | null, EDatabase>;
  create: (draft: TMessageDraft) => Effect.Effect<TMessageRow, EDatabase>;
  remove: (id: string) => Effect.Effect<boolean, EDatabase>;
};

export type TMessageRepoId = TServiceId<typeof REPO_TAG.HACKATHON_MESSAGE>;

export const MessageRepo = Context.Service<TMessageRepoId, TMessageRepo>(
  REPO_TAG.HACKATHON_MESSAGE
);
