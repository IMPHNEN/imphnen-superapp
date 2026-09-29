import { MenuOutlined } from '@ant-design/icons';
import {
  sessionEnsure,
  useCurrentUser,
} from '@imphnen-frontend-service/service/session';
import { queryClient } from '@imphnen-frontend-service/utils';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { type ReactElement, useState } from 'react';
import { PageLoader } from '../components/PageLoader';
import { Sidebar } from '../components/Sidebar';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async (): Promise<void> => {
    const me = await sessionEnsure(queryClient);
    if (!me) throw redirect({ to: '/auth/login', replace: true });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout(): ReactElement {
  const { me } = useCurrentUser();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!me) return <PageLoader />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-700"
            >
              <MenuOutlined className="text-lg" />
            </button>
            <h1 className="font-semibold text-gray-900">QR Campaign</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
