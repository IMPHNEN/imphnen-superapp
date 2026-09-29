import { PERMISSION } from '@app/permissions';
import {
  SESSION_STATUS,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import {
  createFileRoute,
  Navigate,
  Outlet,
  useLocation,
} from '@tanstack/react-router';
import { type ReactElement, type ReactNode, useState } from 'react';
import { Sidebar } from '../components/sidebar';
import { useParticipantMe } from '../hooks/use-participant';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedGuard,
});

const FullPageSpinner = (): ReactElement => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

const FullPageMessage = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactElement => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4 text-center">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
      {title}
    </h2>
    <p className="text-gray-600 dark:text-gray-400">{children}</p>
  </div>
);

function AuthenticatedGuard(): ReactElement {
  const { status, can } = useCurrentUser();
  const pathname = useLocation({ select: (location) => location.pathname });
  const isAuthenticated = status === SESSION_STATUS.AUTHENTICATED;
  const canParticipate =
    isAuthenticated && can(PERMISSION.HACKATHON_PARTICIPATE);
  const participant = useParticipantMe(canParticipate);

  if (status === SESSION_STATUS.LOADING) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!canParticipate) {
    return (
      <FullPageMessage title="Access Denied">
        Your account does not have access to the hackathon.
      </FullPageMessage>
    );
  }
  if (participant.isPending) return <FullPageSpinner />;
  if (participant.isError) {
    return (
      <FullPageMessage title="Something went wrong">
        {participant.error.message}
      </FullPageMessage>
    );
  }

  const isOnboarding = pathname.startsWith('/onboarding');
  if (!participant.data.location && !isOnboarding) {
    return <Navigate to="/onboarding/user" replace />;
  }

  return <AuthenticatedLayout />;
}

function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-700 px-4 py-3 flex items-center z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="ml-3 text-lg font-bold text-gray-900 dark:text-white">
            Hackathon
          </h1>
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
