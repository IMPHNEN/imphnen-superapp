import { z } from 'zod';

export const MENTORING_SESSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type TMentoringSessionStatus =
  (typeof MENTORING_SESSION_STATUS)[keyof typeof MENTORING_SESSION_STATUS];

export const mentoringSessionStatusSchema = z.enum([
  MENTORING_SESSION_STATUS.PENDING,
  MENTORING_SESSION_STATUS.CONFIRMED,
  MENTORING_SESSION_STATUS.COMPLETED,
  MENTORING_SESSION_STATUS.CANCELLED,
  MENTORING_SESSION_STATUS.NO_SHOW,
]);

export const MENTORING_SESSION_TYPE = {
  ONLINE: 'online',
  OFFLINE: 'offline',
} as const;

export type TMentoringSessionType =
  (typeof MENTORING_SESSION_TYPE)[keyof typeof MENTORING_SESSION_TYPE];

export const mentoringSessionTypeSchema = z.enum([
  MENTORING_SESSION_TYPE.ONLINE,
  MENTORING_SESSION_TYPE.OFFLINE,
]);

export const MENTORING_PARTICIPANT_ROLE = {
  MENTEE: 'mentee',
  MENTOR: 'mentor',
} as const;

export type TMentoringParticipantRole =
  (typeof MENTORING_PARTICIPANT_ROLE)[keyof typeof MENTORING_PARTICIPANT_ROLE];

export const MENTORING_LIMIT = {
  TOPIC_MIN: 3,
  TOPIC_MAX: 200,
  DESCRIPTION_MAX: 1000,
  DURATION_MIN: 15,
  DURATION_MAX: 240,
  DURATION_DEFAULT: 60,
  FEEDBACK_MIN: 10,
  FEEDBACK_MAX: 2000,
  RATING_MIN: 1,
  RATING_MAX: 5,
  MEETING_LINK_MAX: 500,
  TOP_TOPICS: 5,
} as const;
