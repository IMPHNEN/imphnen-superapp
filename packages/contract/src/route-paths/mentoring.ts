const SESSIONS = '/mentoring/sessions';

export const MENTORING_ROUTE_PATH = {
  MENTORING_SESSIONS: SESSIONS,
  MENTORING_SESSIONS_MINE: `${SESSIONS}/mine`,
  MENTORING_SESSIONS_OVERVIEW: `${SESSIONS}/overview`,
  MENTORING_SESSION: `${SESSIONS}/{id}`,
  MENTORING_SESSION_CANCEL: `${SESSIONS}/{id}/cancel`,
  MENTORING_SESSION_FEEDBACK: `${SESSIONS}/{id}/feedback`,
  MENTORING_AVAILABILITY: '/mentoring/mentors/{mentorUserId}/availability',
  MENTORING_MENTOR_STATS: '/mentoring/me/stats',
  MENTORING_MENTOR_MENTEES: '/mentoring/me/mentees',
} as const;
