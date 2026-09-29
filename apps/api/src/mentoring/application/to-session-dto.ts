import { mentoringSessionSchema, type TMentoringSession } from '@app/schemas';
import type { TMentoringSessionRow } from '#/mentoring/domain/mentoring-session.ts';

export const toSessionDto = (row: TMentoringSessionRow): TMentoringSession =>
  mentoringSessionSchema.parse({
    id: row.id,
    mentor: row.mentor,
    mentee: row.mentee,
    topic: row.topic,
    description: row.description,
    scheduledAt: row.scheduledAt.toISOString(),
    durationMinutes: row.durationMinutes,
    sessionType: row.sessionType,
    status: row.status,
    meetingLink: row.meetingLink,
    feedback: row.feedback,
    rating: row.rating,
    feedbackSubmittedAt: row.feedbackSubmittedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
