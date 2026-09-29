import type {
  TMentoringBookInput,
  TMentoringFeedbackInput,
  TMentoringListMineInput,
  TMentoringManageListInput,
  TMentoringMenteeListInput,
  TMentoringMentorStats,
  TMentoringOverview,
  TMentoringSessionStatus,
  TMentoringSessionType,
} from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TParticipantRow = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
};

export type TMentoringSessionRow = TBaseRow & {
  mentor: TParticipantRow & { mentorId: string | null };
  mentee: TParticipantRow;
  topic: string;
  description: string | null;
  scheduledAt: Date;
  durationMinutes: number;
  sessionType: TMentoringSessionType;
  status: TMentoringSessionStatus;
  meetingLink: string | null;
  feedback: string | null;
  rating: number | null;
  feedbackSubmittedAt: Date | null;
};

export type TMenteeRow = TParticipantRow & {
  sessionCount: number;
  completedSessionCount: number;
  lastSessionAt: Date;
};

export type TBusyRow = { start: Date; end: Date };

export type TSessionChange = {
  status?: TMentoringSessionStatus;
  meetingLink?: string | null;
};

export type TMentoringSessionRepo = {
  findById: (
    id: string
  ) => Effect.Effect<TMentoringSessionRow | null, EDatabase>;
  listFor: (
    input: TMentoringListMineInput,
    userId: string
  ) => Effect.Effect<TRowPage<TMentoringSessionRow>, EDatabase>;
  manageList: (
    input: TMentoringManageListInput
  ) => Effect.Effect<TRowPage<TMentoringSessionRow>, EDatabase>;
  book: (
    input: TMentoringBookInput,
    menteeId: string
  ) => Effect.Effect<TMentoringSessionRow | null, EDatabase>;
  change: (
    id: string,
    from: TMentoringSessionStatus,
    change: TSessionChange
  ) => Effect.Effect<TMentoringSessionRow | null, EDatabase>;
  feedbackSet: (
    input: TMentoringFeedbackInput,
    menteeId: string
  ) => Effect.Effect<TMentoringSessionRow | null, EDatabase>;
  busy: (
    mentorUserId: string,
    from: Date,
    to: Date
  ) => Effect.Effect<readonly TBusyRow[], EDatabase>;
  mentorStats: (
    mentorUserId: string,
    now: Date
  ) => Effect.Effect<TMentoringMentorStats, EDatabase>;
  menteeList: (
    input: TMentoringMenteeListInput,
    mentorUserId: string
  ) => Effect.Effect<TRowPage<TMenteeRow>, EDatabase>;
  overview: () => Effect.Effect<TMentoringOverview, EDatabase>;
};

export type TMentoringSessionRepoId = TServiceId<
  typeof REPO_TAG.MENTORING_SESSION
>;

export const MentoringSessionRepo = Context.Service<
  TMentoringSessionRepoId,
  TMentoringSessionRepo
>(REPO_TAG.MENTORING_SESSION);
