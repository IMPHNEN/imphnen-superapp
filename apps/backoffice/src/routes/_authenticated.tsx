import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import {
  SESSION_STATUS,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import {
  SidebarInset,
  SidebarProvider,
} from '@imphnen-frontend-service/ui/atoms';
import { BackofficeSidebar } from '../components/sidebar';
import { AccessDenied, FullPageSpinner } from '../components/session-screens';
import {
  hasBackofficeAccess,
  PAGE_PERMISSION,
  pagePathOf,
} from '../libs/access';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { me, status, can } = useCurrentUser();
  const { pathname } = useLocation();

  if (status === SESSION_STATUS.LOADING) return <FullPageSpinner />;
  if (!me) return <Navigate to="/auth/login" />;
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
