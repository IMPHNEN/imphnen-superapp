import { ACTIVITY_ACTION, ACTIVITY_RESOURCE_TYPE } from '@app/activity';

export const QR_ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.QR_CAMPAIGN_CREATE]: 'QR campaign created',
  [ACTIVITY_ACTION.QR_CAMPAIGN_ACTIVATE]: 'QR campaign activated',
  [ACTIVITY_ACTION.QR_CAMPAIGN_DELETE]: 'QR campaign deleted',
} as const;

export const QR_ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.QR_CAMPAIGN]: 'QR campaign',
} as const;
