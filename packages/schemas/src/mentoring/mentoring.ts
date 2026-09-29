import { z } from 'zod';
import { userIdSchema } from '../auth/auth.ts';
import { baseSchema, type TEntityOf } from '../shared/base-schema.ts';
import { paginated } from '../shared/pagination.ts';
import {
  mentoringSessionStatusSchema,
  mentoringSessionTypeSchema,
} from './mentoring-constants.ts';

const dateTimeSchema = z.iso.datetime();
const countSchema = z.number().int().min(0);

export const mentoringParticipantSchema = z.object({
  userId: userIdSchema,
  name: z.string(),
  email: z.email(),
  image: z.string().nullable(),
});

export const mentoringSessionSchema = baseSchema(z.uuid()).extend({
  mentor: mentoringParticipantSchema.extend({
    mentorId: z.uuid().nullable(),
  }),
  mentee: mentoringParticipantSchema,
  topic: z.string(),
  description: z.string().nullable(),
  scheduledAt: dateTimeSchema,
  durationMinutes: z.number().int(),
  sessionType: mentoringSessionTypeSchema,
  status: mentoringSessionStatusSchema,
  meetingLink: z.string().nullable(),
  feedback: z.string().nullable(),
  rating: z.number().int().nullable(),
  feedbackSubmittedAt: dateTimeSchema.nullable(),
});
export type TMentoringSession = TEntityOf<
  z.infer<typeof mentoringSessionSchema>
>;

export const mentoringSessionListSchema = paginated(mentoringSessionSchema);
export type TMentoringSessionList = z.infer<typeof mentoringSessionListSchema>;

export const mentoringBusySlotSchema = z.object({
  start: dateTimeSchema,
  end: dateTimeSchema,
});

export const mentoringAvailabilitySchema = z.object({
  mentorId: z.uuid(),
  mentorUserId: userIdSchema,
  availabilityCommitment: z.string().nullable(),
  preferredMentoringFormats: z.array(z.string()),
  windowStart: dateTimeSchema,
  windowEnd: dateTimeSchema,
  busy: z.array(mentoringBusySlotSchema),
});
export type TMentoringAvailability = z.infer<
  typeof mentoringAvailabilitySchema
>;

export const mentoringMentorStatsSchema = z.object({
  ratingAverage: z.number().nullable(),
  ratingCount: countSchema,
  completedSessionCount: countSchema,
  menteesImpacted: countSchema,
  feedbackCount: countSchema,
  pendingSessionCount: countSchema,
  upcomingSessionCount: countSchema,
});
export type TMentoringMentorStats = z.infer<typeof mentoringMentorStatsSchema>;

export const mentoringMenteeSchema = mentoringParticipantSchema.extend({
  sessionCount: countSchema,
  completedSessionCount: countSchema,
  lastSessionAt: dateTimeSchema,
});
export type TMentoringMentee = z.infer<typeof mentoringMenteeSchema>;

export const mentoringMenteeListSchema = paginated(mentoringMenteeSchema);
export type TMentoringMenteeList = z.infer<typeof mentoringMenteeListSchema>;

export const mentoringStatusCountSchema = z.object({
  status: mentoringSessionStatusSchema,
  count: countSchema,
});

export const mentoringTopicCountSchema = z.object({
  topic: z.string(),
  count: countSchema,
});

export const mentoringOverviewSchema = z.object({
  total: countSchema,
  byStatus: z.array(mentoringStatusCountSchema),
  ratingAverage: z.number().nullable(),
  feedbackCount: countSchema,
  topTopics: z.array(mentoringTopicCountSchema),
});
export type TMentoringOverview = z.infer<typeof mentoringOverviewSchema>;
