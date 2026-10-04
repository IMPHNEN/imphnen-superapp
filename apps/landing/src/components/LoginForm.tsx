import type { ReactElement } from 'react';
import { useLogin } from '@/hooks/use-login';
import { withQueryClient } from './providers/QueryIsland';
import { authClient } from '@imphnen-frontend-service/service';

const ICON_ALERT = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Alert</title>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ICON_CHECK = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Check</title>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const ICON_GITHUB = (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <title>Github</title>
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.17c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.74.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.15 1.18a10.9 10.9 0 0 1 5.74 0c2.19-1.49 3.15-1.18 3.15-1.18.62 1.59.23 2.77.11 3.06.73.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.35.78 1.04.78 2.1v3.1c0 .3.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const LOGIN_SUCCESS = 'Login berhasil! Mengalihkan...';

function LoginForm(): ReactElement {
  const { isSuccess, errorMessage } = useLogin();
  const error = errorMessage;
  const success = isSuccess ? LOGIN_SUCCESS : '';

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#fff5f5',
            border: '1.5px solid #ffcdd2',
            color: '#c62828',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: '1px', color: '#e53935' }}>
            {ICON_ALERT}
          </span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            marginBottom: '20px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: '#f0fff4',
            border: '1.5px solid #a7f3d0',
            color: '#065f46',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: '1px', color: '#059669' }}>
            {ICON_CHECK}
          </span>
          <span>{success}</span>
        </div>
      )}
      <button
        type="button"
        onClick={() =>
          authClient.signIn.social({
            provider: 'github',
            callbackURL: `${window.location.origin}`,
            errorCallbackURL: `${window.location.origin}/login`,
          })
        }
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
      >
        {ICON_GITHUB}
        Continue with GitHub
      </button>
    </div>
  );
}

export default withQueryClient(LoginForm);
