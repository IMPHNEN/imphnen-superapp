import {
  HACKATHON_DECISION_STATUS,
  HACKATHON_SUBMISSION_STATUS,
  type THackathonDecisionStatus,
  type THackathonMemberRole,
  type THackathonSubmissionStatus,
  type THackathonTeamVisibility,
} from '@app/schemas';
import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import {
  createdAtColumn,
  timestampColumn,
  updatedAtColumn,
} from '#/platform/db/columns/timestamps.ts';
import { user } from '#/platform/db/tables/auth.ts';

const idColumn = () =>
  text('id')
    .primaryKey()
    .$defaultFn((): string => crypto.randomUUID());

const PENDING_ONLY = sql.raw(`status = '${HACKATHON_DECISION_STATUS.PENDING}'`);

export const hackathonParticipant = sqliteTable('hackathon_participant', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  phoneNumber: text('phone_number'),
  location: text('location'),
  bio: text('bio'),
  skills: text('skills', { mode: 'json' })
    .$type<readonly string[]>()
    .notNull()
    .default([]),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const hackathonTeam = sqliteTable(
  'hackathon_team',
  {
    id: idColumn(),
    name: text('name').notNull(),
    description: text('description'),
    city: text('city').notNull(),
    visibility: text('visibility').$type<THackathonTeamVisibility>().notNull(),
    logoKey: text('logo_key'),
    bannerKey: text('banner_key'),
    leaderId: text('leader_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    index('hackathon_team_visibility_created_idx').on(
      table.visibility,
      table.createdAt
    ),
    index('hackathon_team_leader_idx').on(table.leaderId),
  ]
);

export const hackathonTeamMember = sqliteTable(
  'hackathon_team_member',
  {
    id: idColumn(),
    teamId: text('team_id')
      .notNull()
      .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').$type<THackathonMemberRole>().notNull(),
    joinedAt: timestampColumn('joined_at').notNull(),
  },
  (table) => [
    uniqueIndex('hackathon_team_member_user_unique').on(table.userId),
    index('hackathon_team_member_team_idx').on(table.teamId),
  ]
);

export const hackathonInvitation = sqliteTable(
  'hackathon_invitation',
  {
    id: idColumn(),
    teamId: text('team_id')
      .notNull()
      .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    inviteeEmail: text('invitee_email').notNull(),
    status: text('status')
      .$type<THackathonDecisionStatus>()
      .notNull()
      .default(HACKATHON_DECISION_STATUS.PENDING),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('hackathon_invitation_pending_unique')
      .on(table.teamId, table.inviteeEmail)
      .where(PENDING_ONLY),
    index('hackathon_invitation_email_idx').on(
      table.inviteeEmail,
      table.status
    ),
  ]
);

export const hackathonJoinRequest = sqliteTable(
  'hackathon_join_request',
  {
    id: idColumn(),
    teamId: text('team_id')
      .notNull()
      .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    status: text('status')
      .$type<THackathonDecisionStatus>()
      .notNull()
      .default(HACKATHON_DECISION_STATUS.PENDING),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
  },
  (table) => [
    uniqueIndex('hackathon_join_request_pending_unique')
      .on(table.teamId, table.userId)
      .where(PENDING_ONLY),
    index('hackathon_join_request_user_idx').on(table.userId, table.status),
  ]
);

export const hackathonSubmission = sqliteTable('hackathon_submission', {
  id: idColumn(),
  teamId: text('team_id')
    .notNull()
    .unique()
    .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
  projectName: text('project_name').notNull(),
  description: text('description').notNull(),
  repositoryUrl: text('repository_url').notNull(),
  demoUrl: text('demo_url'),
  presentationUrl: text('presentation_url'),
  videoUrl: text('video_url'),
  screenshotKeys: text('screenshot_keys', { mode: 'json' })
    .$type<readonly string[]>()
    .notNull()
    .default([]),
  status: text('status')
    .$type<THackathonSubmissionStatus>()
    .notNull()
    .default(HACKATHON_SUBMISSION_STATUS.DRAFT),
  submittedAt: timestampColumn('submitted_at'),
  createdBy: text('created_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});

export const hackathonMessage = sqliteTable(
  'hackathon_message',
  {
    id: idColumn(),
    teamId: text('team_id')
      .notNull()
      .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    index('hackathon_message_team_created_idx').on(
      table.teamId,
      table.createdAt,
      table.id
    ),
  ]
);

export const hackathonWinner = sqliteTable('hackathon_winner', {
  id: idColumn(),
  teamId: text('team_id')
    .notNull()
    .unique()
    .references(() => hackathonTeam.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  prize: text('prize'),
  announcedAt: timestampColumn('announced_at').notNull(),
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
});
