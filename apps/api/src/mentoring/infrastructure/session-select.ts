import { A } from '@mobily/ts-belt';
import { and, eq, isNull, type SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/sqlite-core';
import type { TMentoringSessionRow } from '#/mentoring/domain/mentoring-session.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { mentoringSession } from '#/platform/db/tables/mentoring.ts';

const USER_ALIAS = {
  MENTOR: 'mentor_user',
  MENTEE: 'mentee_user',
} as const;

const mentorUser = alias(user, USER_ALIAS.MENTOR);
const menteeUser = alias(user, USER_ALIAS.MENTEE);

type TSessionSelected = {
  session: typeof mentoringSession.$inferSelect;
  mentorId: string | null;
  mentorName: string;
  mentorEmail: string;
  mentorImage: string | null;
  menteeName: string;
  menteeEmail: string;
  menteeImage: string | null;
};

export type TSessionQuery = {
  where: SQL | undefined;
  orderBy: readonly SQL[];
  limit: number;
  offset: number;
};

const toSessionRow = (selected: TSessionSelected): TMentoringSessionRow => {
  const { mentorUserId, menteeId, ...session } = selected.session;
  return {
    ...session,
    mentor: {
      mentorId: selected.mentorId,
      userId: mentorUserId,
      name: selected.mentorName,
      email: selected.mentorEmail,
      image: selected.mentorImage,
    },
    mentee: {
      userId: menteeId,
      name: selected.menteeName,
      email: selected.menteeEmail,
      image: selected.menteeImage,
    },
  };
};

export const sessionRowsSelect = async (
  db: TDb,
  query: TSessionQuery
): Promise<readonly TMentoringSessionRow[]> => {
  const rows = await db
    .select({
      session: mentoringSession,
      mentorId: mentor.id,
      mentorName: mentorUser.name,
      mentorEmail: mentorUser.email,
      mentorImage: mentorUser.image,
      menteeName: menteeUser.name,
      menteeEmail: menteeUser.email,
      menteeImage: menteeUser.image,
    })
    .from(mentoringSession)
    .innerJoin(mentorUser, eq(mentorUser.id, mentoringSession.mentorUserId))
    .innerJoin(menteeUser, eq(menteeUser.id, mentoringSession.menteeId))
    .leftJoin(
      mentor,
      and(
        eq(mentor.userId, mentoringSession.mentorUserId),
        isNull(mentor.deletedAt)
      )
    )
    .where(query.where)
    .orderBy(...query.orderBy)
    .limit(query.limit)
    .offset(query.offset);
  return A.map(rows, toSessionRow);
};

export const sessionRowSelect = async (
  db: TDb,
  id: string
): Promise<TMentoringSessionRow | null> => {
  const [row] = await sessionRowsSelect(db, {
    where: eq(mentoringSession.id, id),
    orderBy: [],
    limit: 1,
    offset: 0,
  });
  return row ?? null;
};

export const sessionReread = async (
  db: TDb,
  written: readonly { id: string }[]
): Promise<TMentoringSessionRow | null> => {
  const [found] = written;
  return found === undefined ? null : sessionRowSelect(db, found.id);
};
