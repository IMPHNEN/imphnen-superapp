import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const PROFILE_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.PROFILE_UPDATE]: 'Profile updated',
  [ACTIVITY_ACTION.PROFILE_AVATAR_UPDATE]: 'Profile photo changed',
} as const;

export const PROFILE_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.PROFILE]: 'Profile',
} as const;
