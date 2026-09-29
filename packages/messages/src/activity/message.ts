import {
  ACTIVITY_ACTION,
  ACTIVITY_DETAIL,
  ACTIVITY_RESOURCE_TYPE,
  type TActivityAction,
  type TActivityResourceType,
} from '@app/activity';

export const ACTIVITY_MESSAGE = {
  TITLE: 'Activity',
  EMPTY: 'No activity yet.',
  PAGINATION_NOUN: 'entries',
  FILTER_ACTION: 'Action',
  FILTER_ACTION_ALL: 'All actions',
  FILTER_ENTITY: 'Entity',
  FILTER_ENTITY_ALL: 'All entities',
  COLUMN_WHEN: 'When',
  COLUMN_ACTOR: 'Actor',
  COLUMN_ACTION: 'Action',
  COLUMN_ENTITY: 'Entity',
  COLUMN_DETAILS: 'Details',
} as const;

export const ACTIVITY_ACTION_LABEL = {
  [ACTIVITY_ACTION.USER_CREATE]: 'User created',
  [ACTIVITY_ACTION.USER_UPDATE]: 'User updated',
  [ACTIVITY_ACTION.USER_DELETE]: 'User deleted',
  [ACTIVITY_ACTION.USER_PASSWORD_RESET]: 'Password reset',
  [ACTIVITY_ACTION.ROLE_CREATE]: 'Role created',
  [ACTIVITY_ACTION.ROLE_UPDATE]: 'Role updated',
  [ACTIVITY_ACTION.ROLE_DELETE]: 'Role deleted',
  [ACTIVITY_ACTION.SESSION_CREATE]: 'Signed in',
} as const satisfies Record<TActivityAction, string>;

export const ACTIVITY_DETAIL_LABEL = {
  [ACTIVITY_DETAIL.LABEL]: 'Label',
  [ACTIVITY_DETAIL.TITLE]: 'Title',
  [ACTIVITY_DETAIL.EMAIL]: 'Email',
  [ACTIVITY_DETAIL.NAME]: 'Name',
  [ACTIVITY_DETAIL.ROLE]: 'Role',
  [ACTIVITY_DETAIL.PERMISSION_COUNT]: 'Permissions',
  [ACTIVITY_DETAIL.PERMISSIONS_ADDED]: 'Added',
  [ACTIVITY_DETAIL.PERMISSIONS_REMOVED]: 'Removed',
  [ACTIVITY_DETAIL.FILE_NAME]: 'File',
  [ACTIVITY_DETAIL.BYTE_SIZE]: 'Size',
  [ACTIVITY_DETAIL.CHANGED_FIELDS]: 'Changed',
} as const;

export const ACTIVITY_ENTITY_LABEL = {
  [ACTIVITY_RESOURCE_TYPE.USER]: 'User',
  [ACTIVITY_RESOURCE_TYPE.ROLE]: 'Role',
  [ACTIVITY_RESOURCE_TYPE.SESSION]: 'Session',
} as const satisfies Record<TActivityResourceType, string>;
