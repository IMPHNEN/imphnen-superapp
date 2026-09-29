import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const MENTORING_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.MENTORING_SESSION_BOOK]: 'Mentoring session booked',
  [ACTIVITY_ACTION.MENTORING_SESSION_UPDATE]: 'Mentoring session updated',
  [ACTIVITY_ACTION.MENTORING_SESSION_CANCEL]: 'Mentoring session cancelled',
  [ACTIVITY_ACTION.MENTORING_SESSION_FEEDBACK]: 'Mentoring feedback submitted',
} as const;

export const MENTORING_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.MENTORING_SESSION]: 'Mentoring session',
} as const;
