import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { ensureMe } from '../libs/session/ensure-me';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    // Development-only bypass explicitly requested via environment flags
    const bypassAuth =
      import.meta.env.MODE === 'development' &&
      import.meta.env.VITE_BYPASS_AUTH_MIDDLEWARE === 'true';

    if (bypassAuth) {
      return;
    }

    const me = await ensureMe();
    if (!me) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}
