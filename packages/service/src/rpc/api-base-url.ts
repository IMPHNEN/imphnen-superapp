const PRODUCTION_API_URL = 'https://api.imphnen.dev';

type TImportMetaEnv = {
  DEV?: boolean;
  VITE_API_URL?: string;
  PUBLIC_API_URL?: string;
};

const envOf = (): TImportMetaEnv =>
  (import.meta as unknown as { env?: TImportMetaEnv }).env ?? {};

export const apiBaseUrl = (): string => {
  const env = envOf();
  if (env.DEV && typeof window !== 'undefined') return window.location.origin;
  return env.VITE_API_URL || env.PUBLIC_API_URL || PRODUCTION_API_URL;
};
