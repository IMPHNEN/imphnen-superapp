export const MENTORING_MESSAGE = {
  NOT_FOUND: 'This mentoring session could not be found.',
  MENTOR_UNAVAILABLE: 'This mentor is not accepting bookings.',
  SELF_BOOKING: "You can't book a session with yourself.",
  SCHEDULE_IN_PAST: 'Choose a time in the future.',
  SCHEDULE_CONFLICT: 'The mentor already has a session at that time.',
  TRANSITION_NOT_ALLOWED: "This session can't move to that status.",
  NOT_STARTED: "A session can't be closed before it starts.",
  MENTOR_ONLY: 'Only the mentor of this session can do this.',
  MENTEE_ONLY: 'Only the mentee of this session can submit feedback.',
  FEEDBACK_NOT_ALLOWED:
    'Feedback can be given once, and only for a completed session.',
  MEETING_LINK_LOCKED:
    "The meeting link can't be changed once the session has ended.",
  CHANGED: 'This session was changed in the meantime. Reload and try again.',
} as const;
