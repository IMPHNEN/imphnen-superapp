import { ROLE } from '@app/permissions';
import { MENTOR_REVIEW_DECISION, MENTOR_STATUS } from '@app/schemas';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { Effect } from 'effect';
import { match } from 'ts-pattern';
import type { TMentorRepo } from '#/mentor/domain/mentor.ts';
import {
  MENTOR_REVIEW_FROM,
  MENTOR_REVIEW_TO,
} from '#/mentor/domain/mentor-status.ts';
import {
  mentorLiveWhere,
  mentorReread,
} from '#/mentor/infrastructure/mentor-select.ts';
import type { TDb } from '#/platform/db/client.ts';
import { user } from '#/platform/db/tables/auth.ts';
import { mentor } from '#/platform/db/tables/mentor.ts';
import { EDatabase } from '#/shared/errors.ts';

type TMentorReviews = Pick<TMentorRepo, 'review' | 'remove'>;

export const mentorReviewsBuild = (db: TDb): TMentorReviews => {
  const review: TMentorRepo['review'] = (input, reviewerId) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const reviewed = db
          .update(mentor)
          .set({
            status: MENTOR_REVIEW_TO[input.decision],
            reviewNote: input.note ?? null,
            reviewedAt: now,
            reviewedBy: reviewerId,
            updatedAt: now,
          })
          .where(
            and(
              mentorLiveWhere(input.id),
              inArray(mentor.status, [...MENTOR_REVIEW_FROM[input.decision]])
            )
          )
          .returning({ id: mentor.id });
        const promoted = db
          .update(user)
          .set({ role: ROLE.MENTOR, updatedAt: now })
          .where(
            and(
              eq(user.role, ROLE.USER),
              inArray(
                user.id,
                db
                  .select({ id: mentor.userId })
                  .from(mentor)
                  .where(
                    and(
                      mentorLiveWhere(input.id),
                      eq(mentor.status, MENTOR_STATUS.ACTIVE)
                    )
                  )
              )
            )
          );
        const written = await match(input.decision)
          .with(MENTOR_REVIEW_DECISION.APPROVE, async () => {
            const [rows] = await db.batch([reviewed, promoted]);
            return rows;
          })
          .with(MENTOR_REVIEW_DECISION.REJECT, () => reviewed)
          .exhaustive();
        return mentorReread(db, written);
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  const remove: TMentorRepo['remove'] = (id) =>
    Effect.tryPromise({
      try: async () => {
        const now = new Date();
        const [removed] = await db.batch([
          db
            .update(mentor)
            .set({ deletedAt: now, updatedAt: now })
            .where(mentorLiveWhere(id))
            .returning({ id: mentor.id }),
          db
            .update(user)
            .set({ role: ROLE.USER, updatedAt: now })
            .where(
              and(
                eq(user.role, ROLE.MENTOR),
                inArray(
                  user.id,
                  db
                    .select({ id: mentor.userId })
                    .from(mentor)
                    .where(and(eq(mentor.id, id), isNotNull(mentor.deletedAt)))
                )
              )
            ),
        ]);
        return removed.length > 0;
      },
      catch: (cause) => new EDatabase({ cause }),
    });

  return { review, remove };
};
