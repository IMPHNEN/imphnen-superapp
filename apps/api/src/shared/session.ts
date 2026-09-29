import type { TPermission } from '@app/permissions';

export type TSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  image: string | null;
};

export type TSession = {
  user: TSessionUser;
  permissions: readonly TPermission[];
};

export const SESSION_STATE = {
  RESOLVED: 'resolved',
  ANONYMOUS: 'anonymous',
  UNAVAILABLE: 'unavailable',
} as const;

export type TSessionState = (typeof SESSION_STATE)[keyof typeof SESSION_STATE];
