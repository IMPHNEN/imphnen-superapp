import type { TSessionUser } from '#/shared/session.ts';

export type TOwnedEntity = { readonly authorId: string };

export type TOwnershipActor = Pick<TSessionUser, 'id' | 'role'>;
