export const LOGIN_PATH = '/login';

/** Only same-origin paths are accepted, so `?redirect=` cannot leave the site. */
export const safeRedirectPath = (value: string | null | undefined): string =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/';

export const loginUrlFor = (returnTo: string): string =>
  `${LOGIN_PATH}?redirect=${encodeURIComponent(returnTo)}`;
