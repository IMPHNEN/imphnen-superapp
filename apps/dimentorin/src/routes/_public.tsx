import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { ensureMe } from '../libs/session/ensure-me';

const SESSION_ALLOWED_PATHS = ['/auth/register/success'];

export const Route = createFileRoute('/_public')({
  beforeLoad: async ({ location }) => {
    // Email verification signs the user in, so the success page must stay
    // reachable with a session.
    if (SESSION_ALLOWED_PATHS.includes(location.pathname)) return;
    const me = await ensureMe();
    if (me) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <main className="bg-primary-50 min-h-screen">
      <Outlet />
    </main>
  );
}
