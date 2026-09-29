export const MENTORING_ACTIVITY_RESOURCE_TYPE = {
  MENTORING_SESSION: 'mentoring_session',
} as const;

export const MENTORING_ACTIVITY_ACTION = {
  MENTORING_SESSION_BOOK: 'mentoring_session.book',
  MENTORING_SESSION_UPDATE: 'mentoring_session.update',
  MENTORING_SESSION_CANCEL: 'mentoring_session.cancel',
  MENTORING_SESSION_FEEDBACK: 'mentoring_session.feedback',
} as const;
