import { emailOTPClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';
import { apiBaseUrl } from './api-base-url';

const AUTH_PATH = '/api/auth';

export const authClient = createAuthClient({
  baseURL: `${apiBaseUrl()}${AUTH_PATH}`,
  fetchOptions: { credentials: 'include' },
  plugins: [emailOTPClient()],
});
