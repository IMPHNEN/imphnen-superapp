import {
  MENTORING_SESSION_STATUS,
  MENTORING_SESSION_TYPE,
  type TMentoringSessionStatus,
  type TMentoringSessionType,
} from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import type {
  TLegacyMentor,
  TLegacySession,
} from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type { TAdjustment, TStepOutput } from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { TMentoringSessionRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

const LEGACY_SESSION_STATUS = {
  ONGOING: 'ongoing',
  CANCELED: 'canceled',
} as const;
const RATING_MIN = 1;
const RATING_MAX = 5;

type TStatusMapping = {
  readonly status: TMentoringSessionStatus;
  readonly known: boolean;
};

export const sessionStatusOf = (status: string): TStatusMapping =>
  match(status)
    .with(
      MENTORING_SESSION_STATUS.PENDING,
      MENTORING_SESSION_STATUS.CONFIRMED,
      MENTORING_SESSION_STATUS.COMPLETED,
      MENTORING_SESSION_STATUS.CANCELLED,
      MENTORING_SESSION_STATUS.NO_SHOW,
      (same): TStatusMapping => ({ status: same, known: true })
    )
    .with(
      LEGACY_SESSION_STATUS.ONGOING,
      (): TStatusMapping => ({
        status: MENTORING_SESSION_STATUS.CONFIRMED,
        known: true,
      })
    )
    .with(
      LEGACY_SESSION_STATUS.CANCELED,
      (): TStatusMapping => ({
        status: MENTORING_SESSION_STATUS.CANCELLED,
        known: true,
      })
    )
    .otherwise(
      (): TStatusMapping => ({
        status: MENTORING_SESSION_STATUS.CANCELLED,
        known: false,
      })
    );

export const sessionTypeOf = (sessionType: string): TMentoringSessionType =>
  sessionType === MENTORING_SESSION_TYPE.OFFLINE
    ? MENTORING_SESSION_TYPE.OFFLINE
    : MENTORING_SESSION_TYPE.ONLINE;

const ratingOf = (rating: number | null): number | null =>
  rating !== null && rating >= RATING_MIN && rating <= RATING_MAX
    ? rating
    : null;

const rejected = (
  session: TLegacySession,
  reason:
    | typeof REJECT_REASON.MENTOR_ID_UNRESOLVED
    | typeof REJECT_REASON.USER_MISSING,
  detail: string
): TStepOutput =>
  outputOf({
    rejects: [rejectOf(LEGACY_TABLE.SESSIONS, session.id, reason, detail)],
  });

const sessionOutput = (
  session: TLegacySession,
  mentorUserId: string,
  repaired: boolean
): TStepOutput => {
  const status = sessionStatusOf(session.status);
  const rating = ratingOf(session.rating);
  const row: TMentoringSessionRow = {
    id: session.id,
    mentor_user_id: mentorUserId,
    mentee_id: session.mentee_id,
    topic: session.topic,
    description: session.description,
    scheduled_at: session.scheduled_at,
    duration_minutes: session.duration_minutes,
    meeting_link: session.meeting_link,
    session_type: sessionTypeOf(session.session_type),
    status: status.status,
    feedback: session.feedback,
    rating,
    feedback_submitted_at: session.feedback_submitted_at,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.SESSIONS, session.id, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.MENTORING_SESSION, rows: [row] }],
    adjustments: [
      ...(repaired
        ? [
            note(
              ADJUSTMENT_RULE.SESSION_MENTOR_REPAIRED,
              `${session.mentor_id} -> ${mentorUserId}`
            ),
          ]
        : []),
      ...(status.known
        ? []
        : [
            note(
              ADJUSTMENT_RULE.SESSION_STATUS_UNKNOWN,
              `${session.status} -> ${status.status}`
            ),
          ]),
      ...(session.rating !== null && rating === null
        ? [note(ADJUSTMENT_RULE.SESSION_RATING_CLEARED, String(session.rating))]
        : []),
    ],
  });
};

export const sessionsTransform = (
  sessions: readonly TLegacySession[],
  mentors: readonly TLegacyMentor[],
  userIds: ReadonlySet<string>
): TStepOutput => {
  const mentorUserById = new Map(
    A.filterMap(mentors, (mentor): [string, string] | undefined =>
      mentor.id === null ? undefined : [mentor.id, mentor.user_id]
    )
  );
  return outputsMerge(
    A.map(sessions, (session): TStepOutput => {
      const viaMentor = mentorUserById.get(session.mentor_id);
      return match({
        direct: userIds.has(session.mentor_id),
        repaired: viaMentor !== undefined && userIds.has(viaMentor),
        mentee: userIds.has(session.mentee_id),
      })
        .with(
          { direct: false, repaired: false },
          (): TStepOutput =>
            rejected(
              session,
              REJECT_REASON.MENTOR_ID_UNRESOLVED,
              `mentor_id ${session.mentor_id}`
            )
        )
        .with(
          { mentee: false },
          (): TStepOutput =>
            rejected(
              session,
              REJECT_REASON.USER_MISSING,
              `mentee ${session.mentee_id}`
            )
        )
        .with(
          { direct: true },
          (): TStepOutput => sessionOutput(session, session.mentor_id, false)
        )
        .otherwise(
          (): TStepOutput =>
            sessionOutput(session, viaMentor ?? session.mentor_id, true)
        );
    })
  );
};
