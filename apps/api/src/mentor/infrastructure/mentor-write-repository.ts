import {
  MENTOR_DOCUMENT_KIND,
  MENTOR_STATUS,
  type TMentorDocumentKind,
} from '@app/schemas';
import { inArray, isNotNull, or } from 'drizzle-orm';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import type { TMentorRepo } from '#/mentor/domain/mentor.ts';
import { MENTOR_REAPPLY_FROM } from '#/mentor/domain/mentor-status.ts';
import {
  mentorLiveWhere,
  mentorReread,
} from '#/mentor/infrastructure/mentor-select.ts';
import type { TDb } from '#/platform/db/client.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { EDatabase } from '#/shared/errors.ts';

type TMentorWrites = Pick<
  TMentorRepo,
  'register' | 'update' | 'documentKeySet'
>;

type TDocumentColumns = Partial<
  Pick<typeof mentor.$inferInsert, 'cvKey' | 'identityDocumentKey'>
>;

const EMPTY_OPTIONAL_PROFILE = {
  gender: null,
  domicile: null,
  location: null,
  phoneNumber: null,
  phoneForVerification: null,
  lastEducation: null,
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  twitterUrl: null,
} as const;

const REVIEW_RESET = {
  reviewNote: null,
  reviewedAt: null,
  reviewedBy: null,
  deletedAt: null,
} as const;

const documentColumns = (
  kind: TMentorDocumentKind,
  key: string
): TDocumentColumns =>
  match(kind)
    .with(MENTOR_DOCUMENT_KIND.CV, (): TDocumentColumns => ({ cvKey: key }))
    .with(
      MENTOR_DOCUMENT_KIND.IDENTITY,
      (): TDocumentColumns => ({ identityDocumentKey: key })
    )
    .exhaustive();

export const mentorWritesBuild = (db: TDb): TMentorWrites => {
  const register: TMentorRepo['register'] = (input, userId) =>
    Effect.tryPromise({
      try: async () => {
        const profile = { ...EMPTY_OPTIONAL_PROFILE, ...input };
        const written = await db
          .insert(mentor)
          .values({ ...profile, userId, status: MENTOR_STATUS.PENDING })
          .onConflictDoUpdate({
            target: mentor.userId,
            set: {
              ...profile,
              ...REVIEW_RESET,
              status: MENTOR_STATUS.PENDING,
              updatedAt: new Date(),
            },
            setWhere: or(
              isNotNull(mentor.deletedAt),
              inArray(mentor.status, [...MENTOR_REAPPLY_FROM])
            ),
          })
          .returning({ id: mentor.id });
        return mentorReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const update: TMentorRepo['update'] = (id, patch) =>
    Effect.tryPromise({
      try: async () => {
        const written = await db
          .update(mentor)
          .set({ ...patch, updatedAt: new Date() })
          .where(mentorLiveWhere(id))
          .returning({ id: mentor.id });
        return mentorReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const documentKeySet: TMentorRepo['documentKeySet'] = (id, kind, key) =>
    Effect.tryPromise({
      try: async () => {
        const written = await db
          .update(mentor)
          .set({ ...documentColumns(kind, key), updatedAt: new Date() })
          .where(mentorLiveWhere(id))
          .returning({ id: mentor.id });
        return mentorReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  return { register, update, documentKeySet };
};
