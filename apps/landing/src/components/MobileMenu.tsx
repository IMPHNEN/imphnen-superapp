import { type ReactElement, useEffect, useState } from 'react';
import { LuMenu, LuX, LuLogIn, LuLogOut } from 'react-icons/lu';
import { useAuthControls } from '@/hooks/use-auth-controls';
import { withQueryClient } from './providers/QueryIsland';

interface Navigation {
  title: string;
  link: string;
}

interface Props {
  navigations: Navigation[];
  currentPath: string;
}

function MobileMenu({ navigations, currentPath }: Props): ReactElement {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isSigningOut, signOut } = useAuthControls();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [open]);

  const handleLogout = (): void => {
    setOpen(false);
    signOut();
  };

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-50 p-2 rounded-lg hover:bg-muted transition-colors"
        aria-label={open ? 'Tutup menu' : 'Buka menu'}
      >
        {open ? <LuX className="size-6" /> : <LuMenu className="size-6" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-background flex flex-col">
          <div className="container flex h-20 items-center justify-between">
            <a
              href="/"
              className="relative overflow-hidden rounded"
              onClick={() => setOpen(false)}
            >
              <img src="/logo.webp" alt="IMPHNEN" className="w-24 h-auto" />
            </a>

            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Tutup menu"
            >
              <LuX className="size-6" />
            </button>
          </div>

          <nav className="flex-1 flex flex-col items-center justify-center gap-6 py-10">
            {navigations.map(({ link, title }) => (
              <a
                key={link}
                href={link}
                className={`text-2xl font-medium py-2 px-6 rounded-lg transition-colors ${
                  currentPath === link
                    ? 'text-primary bg-primary/10'
                    : 'text-foreground hover:bg-muted'
                }`}
                onClick={() => setOpen(false)}
              >
                {title}
              </a>
            ))}

            <div className="pt-4 border-t border-border w-full flex justify-center">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  disabled={isSigningOut}
                  className="flex items-center gap-2 text-xl font-medium py-2 px-6 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  <LuLogOut className="size-5" />
                  {isSigningOut ? 'Keluar...' : 'Logout'}
                </button>
              ) : (
                <a
                  href="/login"
                  className="flex items-center gap-2 text-xl font-medium py-2 px-6 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <LuLogIn className="size-5" />
                  Masuk
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default withQueryClient(MobileMenu);
