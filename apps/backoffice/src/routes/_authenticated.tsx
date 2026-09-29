import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import {
  sessionEnsure,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import {
  SidebarInset,
  SidebarProvider,
} from '@imphnen-frontend-service/ui/atoms';
import { queryClient } from '@imphnen-frontend-service/utils';
import { useLocation } from '@tanstack/react-router';
import { BackofficeSidebar } from '../components/sidebar';
import { AccessDenied, FullPageSpinner } from '../components/session-screens';
import {
  hasBackofficeAccess,
  PAGE_PERMISSION,
  pagePathOf,
} from '../libs/access';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const me = await sessionEnsure(queryClient);
    if (!me) throw redirect({ to: '/auth/login', replace: true });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { me, can } = useCurrentUser();
  const { pathname } = useLocation();

  if (!me) return <FullPageSpinner />;
  if (!hasBackofficeAccess(me.permissions)) {
    return (
      <AccessDenied
        description="Akun ini tidak memiliki akses ke Backoffice."
        showSignOut
      />
    );
  }

  const page = pagePathOf(pathname);
  const allowed = !page || can(PAGE_PERMISSION[page]);

  return (
    <SidebarProvider>
      <BackofficeSidebar />
      <SidebarInset>{allowed ? <Outlet /> : <AccessDenied />}</SidebarInset>
    </SidebarProvider>
  );
}
