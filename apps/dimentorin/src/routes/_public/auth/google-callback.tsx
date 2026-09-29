import { createFileRoute, redirect } from '@tanstack/react-router';

// Google sign-in is handled by better-auth (`authClient.signIn.social`): the
// API completes the OAuth callback and redirects back with a session cookie.
// This legacy callback URL only forwards visitors to the login page (signed-in
// users are sent to the dashboard by the public layout guard).
export const Route = createFileRoute('/_public/auth/google-callback')({
  beforeLoad: () => {
    throw redirect({ to: '/auth/login' });
  },
});
