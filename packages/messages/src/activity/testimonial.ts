import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const TESTIMONIAL_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.TESTIMONIAL_CREATE]: 'Testimonial submitted',
  [ACTIVITY_ACTION.TESTIMONIAL_UPDATE]: 'Testimonial updated',
  [ACTIVITY_ACTION.TESTIMONIAL_MODERATE]: 'Testimonial reviewed',
  [ACTIVITY_ACTION.TESTIMONIAL_DELETE]: 'Testimonial deleted',
} as const;

export const TESTIMONIAL_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.TESTIMONIAL]: 'Testimonial',
} as const;
