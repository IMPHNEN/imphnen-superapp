import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const MENTOR_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.MENTOR_REGISTER]: 'Mentor application submitted',
  [ACTIVITY_ACTION.MENTOR_APPROVE]: 'Mentor approved',
  [ACTIVITY_ACTION.MENTOR_REJECT]: 'Mentor rejected',
  [ACTIVITY_ACTION.MENTOR_UPDATE]: 'Mentor profile updated',
  [ACTIVITY_ACTION.MENTOR_DELETE]: 'Mentor deleted',
  [ACTIVITY_ACTION.MENTOR_DOCUMENT_UPLOAD]: 'Mentor document uploaded',
} as const;

export const MENTOR_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.MENTOR]: 'Mentor',
} as const;
