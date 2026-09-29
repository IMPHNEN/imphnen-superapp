import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { paginationSchema } from '../shared/pagination.ts';
import { searchQuerySchema } from '../shared/search.ts';
import { SORT_DIRECTION, sortDirectionSchema } from '../shared/sort.ts';
import {
  MENTORING_LIMIT,
  MENTORING_PARTICIPANT_ROLE,
  MENTORING_SESSION_STATUS,
  MENTORING_SESSION_TYPE,
  mentoringSessionStatusSchema,
  mentoringSessionTypeSchema,
} from './mentoring-constants.ts';

const HTTP_PROTOCOL = /^https?$/;

export const mentoringSessionIdSchema = z.uuid();

const ratingSchema = z
  .number()
  .int()
  .min(MENTORING_LIMIT.RATING_MIN)
  .max(MENTORING_LIMIT.RATING_MAX);

export const mentoringSessionIdInputSchema = z.object({
  id: mentoringSessionIdSchema,
});
export type TMentoringSessionIdInput = z.infer<
  typeof mentoringSessionIdInputSchema
>;

export const mentoringAvailabilityInputSchema = z.object({
  mentorUserId: userIdSchema,
});
export type TMentoringAvailabilityInput = z.infer<
  typeof mentoringAvailabilityInputSchema
>;

export const mentoringBookInputSchema = z.object({
  mentorUserId: userIdSchema,
  topic: z
    .string()
    .trim()
    .min(MENTORING_LIMIT.TOPIC_MIN)
    .max(MENTORING_LIMIT.TOPIC_MAX),
  description: z
    .string()
    .trim()
    .max(MENTORING_LIMIT.DESCRIPTION_MAX)
    .optional(),
  scheduledAt: z.iso.datetime({ offset: true }),
  durationMinutes: z
    .number()
    .int()
    .min(MENTORING_LIMIT.DURATION_MIN)
    .max(MENTORING_LIMIT.DURATION_MAX)
    .default(MENTORING_LIMIT.DURATION_DEFAULT),
  sessionType: mentoringSessionTypeSchema.default(
    MENTORING_SESSION_TYPE.ONLINE
  ),
});
export type TMentoringBookInput = z.infer<typeof mentoringBookInputSchema>;

export const mentoringUpdateInputSchema = z
  .object({
    id: mentoringSessionIdSchema,
    status: z
      .enum([
        MENTORING_SESSION_STATUS.CONFIRMED,
        MENTORING_SESSION_STATUS.COMPLETED,
        MENTORING_SESSION_STATUS.NO_SHOW,
      ])
      .optional(),
    meetingLink: z
      .url({ protocol: HTTP_PROTOCOL })
      .max(MENTORING_LIMIT.MEETING_LINK_MAX)
      .nullable()
      .optional(),
  })
  .refine(
    (input): boolean =>
      input.status !== undefined || input.meetingLink !== undefined
  );
export type TMentoringUpdateInput = z.infer<typeof mentoringUpdateInputSchema>;

export const mentoringFeedbackInputSchema = z.object({
  id: mentoringSessionIdSchema,
  feedback: z
    .string()
    .trim()
    .min(MENTORING_LIMIT.FEEDBACK_MIN)
    .max(MENTORING_LIMIT.FEEDBACK_MAX),
  rating: ratingSchema,
});
export type TMentoringFeedbackInput = z.infer<
  typeof mentoringFeedbackInputSchema
>;

const sessionFilterSchema = paginationSchema.extend({
  status: mentoringSessionStatusSchema.optional(),
  hasFeedback: z.boolean().optional(),
  rating: ratingSchema.optional(),
  sortDir: sortDirectionSchema.default(SORT_DIRECTION.DESC),
});

export const mentoringListMineInputSchema = sessionFilterSchema.extend({
  role: z
    .enum([
      MENTORING_PARTICIPANT_ROLE.MENTEE,
      MENTORING_PARTICIPANT_ROLE.MENTOR,
    ])
    .default(MENTORING_PARTICIPANT_ROLE.MENTEE),
});
export type TMentoringListMineInput = z.infer<
  typeof mentoringListMineInputSchema
>;

export const mentoringManageListInputSchema = sessionFilterSchema.extend({
  mentorUserId: userIdSchema.optional(),
  menteeId: userIdSchema.optional(),
  search: searchQuerySchema.optional(),
});
export type TMentoringManageListInput = z.infer<
  typeof mentoringManageListInputSchema
>;

export const mentoringMenteeListInputSchema = paginationSchema;
export type TMentoringMenteeListInput = z.infer<
  typeof mentoringMenteeListInputSchema
>;
