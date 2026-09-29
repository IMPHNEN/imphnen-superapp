import {
  HACKATHON_SUBMISSION_STATUS,
  type THackathonSubmissionCreateInput,
} from '@app/schemas';
import { HACKATHON_MESSAGE } from '@app/messages';
import { D } from '@mobily/ts-belt';
import { and, eq, gte, inArray, type SQL, sql } from 'drizzle-orm';
import { Effect, Layer } from 'effect';
import { EConflict, EDatabase } from '#/shared/errors.ts';
import type { TDb } from '#/platform/db/client.ts';
import { DbService } from '#/platform/db/db-service.ts';
import { isUniqueViolation } from '#/platform/db/unique-violation.ts';
import { hackathonSubmission } from '#/platform/db/tables/hackathon.ts';
import {
  SubmissionRepo,
  type TSubmissionRepo,
} from '#/hackathon/domain/submission-repo.ts';
import type { TSubmissionRow } from '#/hackathon/domain/hackathon-rows.ts';
import { memberCountOf } from '#/hackathon/infrastructure/hackathon-sql.ts';

const submissionInsert = async (
  db: TDb,
  input: THackathonSubmissionCreateInput,
  createdBy: string,
  minMembers: number
): Promise<TSubmissionRow | null> => {
  const now = Date.now();
  const [row] = await db
    .insert(hackathonSubmission)
    .select(
      sql`select ${crypto.randomUUID()}, ${input.teamId}, ${input.projectName}, ${input.description}, ${input.repositoryUrl}, ${input.demoUrl ?? null}, ${input.presentationUrl ?? null}, ${input.videoUrl ?? null}, ${JSON.stringify(input.screenshotKeys)}, ${HACKATHON_SUBMISSION_STATUS.DRAFT}, ${null}, ${createdBy}, ${now}, ${now} where ${memberCountOf(input.teamId)} >= ${minMembers}`
    )
    .returning();
  return row ?? null;
};

export const submissionRepoLayer = Layer.effect(
  SubmissionRepo,
  Effect.gen(function* () {
    const { db } = yield* DbService;

    const findWhere = (
      where: SQL
    ): Effect.Effect<TSubmissionRow | null, EDatabase> =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .select()
            .from(hackathonSubmission)
            .where(where)
            .limit(1);
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const findByTeam: TSubmissionRepo['findByTeam'] = (teamId) =>
      findWhere(eq(hackathonSubmission.teamId, teamId));

    const find: TSubmissionRepo['find'] = (id) =>
      findWhere(eq(hackathonSubmission.id, id));

    const create: TSubmissionRepo['create'] = (input, createdBy, minMembers) =>
      Effect.tryPromise({
        try: () => submissionInsert(db, input, createdBy, minMembers),
        catch: (cause) =>
          isUniqueViolation(cause)
            ? new EConflict({ message: HACKATHON_MESSAGE.SUBMISSION_EXISTS })
            : new EDatabase({ cause }),
      });

    const updateDraft: TSubmissionRepo['updateDraft'] = ({ id, ...patch }) =>
      Effect.tryPromise({
        try: async () => {
          const [row] = await db
            .update(hackathonSubmission)
            .set(D.merge(patch, { updatedAt: new Date() }))
            .where(
              and(
                eq(hackathonSubmission.id, id),
                eq(
                  hackathonSubmission.status,
                  HACKATHON_SUBMISSION_STATUS.DRAFT
                )
              )
            )
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    const transition: TSubmissionRepo['transition'] = (change) =>
      Effect.tryPromise({
        try: async () => {
          const at = new Date();
          const [row] = await db
            .update(hackathonSubmission)
            .set({
              status: change.to,
              updatedAt: at,
              ...(change.stampSubmittedAt ? { submittedAt: at } : {}),
            })
            .where(
              and(
                eq(hackathonSubmission.id, change.id),
                inArray(hackathonSubmission.status, [...change.from]),
                gte(
                  memberCountOf(hackathonSubmission.teamId),
                  change.minMembers
                )
              )
            )
            .returning();
          return row ?? null;
        },
        catch: (cause) => new EDatabase({ cause }),
      });

    return SubmissionRepo.of({
      findByTeam,
      find,
      create,
      updateDraft,
      transition,
    });
  })
);
