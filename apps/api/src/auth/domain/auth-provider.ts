export const AUTH_PROVIDER = {
  CREDENTIAL: 'credential',
} as const;

export type TAuthProvider = (typeof AUTH_PROVIDER)[keyof typeof AUTH_PROVIDER];
