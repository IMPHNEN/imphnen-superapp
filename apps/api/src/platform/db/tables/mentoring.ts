import type {
  TMentoringSessionStatus,
  TMentoringSessionType,
} from '@app/schemas';
import {
  index,
  integer,
  sqliteTable,
  text,
  type AnySQLiteColumn,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

export const mentoringSession = sqliteTable(
  'mentoring_session',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn((): string => crypto.randomUUID()),
    mentorUserId: text('mentor_user_id')
      .notNull()
      .references((): AnySQLiteColumn => user.id, { onDelete: 'cascade' }),
    menteeId: text('mentee_id')
      .notNull()
      .references((): AnySQLiteColumn => user.id, { onDelete: 'cascade' }),
    topic: text('topic').notNull(),
    description: text('description'),
    scheduledAt: timestampColumn('scheduled_at').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    meetingLink: text('meeting_link'),
    sessionType: text('session_type').$type<TMentoringSessionType>().notNull(),
    status: text('status').$type<TMentoringSessionStatus>().notNull(),
    feedback: text('feedback'),
    rating: integer('rating'),
    feedbackSubmittedAt: timestampColumn('feedback_submitted_at'),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index('mentoring_session_mentor_idx').on(
      table.mentorUserId,
      table.scheduledAt
    ),
    index('mentoring_session_mentee_idx').on(table.menteeId, table.scheduledAt),
    index('mentoring_session_status_idx').on(table.status),
  ]
);
