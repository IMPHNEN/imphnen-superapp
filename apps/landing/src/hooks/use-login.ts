import { useSignIn } from '@imphnen-frontend-service/service/session';
import { safeRedirectPath } from '@/lib/redirect';

const REDIRECT_DELAY_MS = 1200;
const LOGIN_FAILED = 'Login gagal. Periksa kembali email dan password Anda.';
const EMAIL_NOT_VERIFIED =
  'Email kamu belum diverifikasi. Cek kotak masuk email untuk kode verifikasi.';

const loginErrorMessage = (error: Error | null): string => {
  if (!error) return '';
  if (/verif/i.test(error.message)) return EMAIL_NOT_VERIFIED;
  if (/invalid/i.test(error.message)) return LOGIN_FAILED;
  return error.message || LOGIN_FAILED;
};

type TLogin = {
  login: (email: string, password: string) => void;
  isPending: boolean;
  isSuccess: boolean;
  errorMessage: string;
};

export const useLogin = (): TLogin => {
  const signIn = useSignIn();

  const login = (email: string, password: string): void => {
    signIn.mutate(
      { email, password },
      {
        onSuccess: (): void => {
          const params = new URLSearchParams(window.location.search);
          const target = safeRedirectPath(params.get('redirect'));
          window.setTimeout(() => {
            window.location.href = target;
          }, REDIRECT_DELAY_MS);
        },
      }
    );
  };

  return {
    login,
    isPending: signIn.isPending,
    isSuccess: signIn.isSuccess,
    errorMessage: loginErrorMessage(signIn.error),
  };
};
