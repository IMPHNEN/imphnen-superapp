import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  useForgotPassword,
  useResetPassword,
} from '@imphnen-frontend-service/service/session';
import {
  errorMessage,
  forgotFormSchema,
  resetFormSchema,
  type TForgotForm,
  type TResetForm,
} from './auth-schemas';

/** The page the reset link in the email points to (reads `?token=`). */
const RESET_PAGE_PATH = '/auth/forgot/summon';

export const useForgotPasswordForm = (onSent: (email: string) => void) => {
  const forgot = useForgotPassword();

  const form = useForm<TForgotForm>({
    resolver: zodResolver(forgotFormSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const send = async (email: string): Promise<void> => {
    try {
      await forgot.mutateAsync({
        email,
        redirectTo: `${globalThis.location.origin}${RESET_PAGE_PATH}`,
      });
      onSent(email);
    } catch (err) {
      toast.error(errorMessage(err, 'Gagal mengirim link reset password'));
    }
  };

  const onSubmit = form.handleSubmit(({ email }) => send(email));

  return { form, onSubmit, resend: send, isLoading: forgot.isPending };
};

export const useResetPasswordForm = (token: string) => {
  const navigate = useNavigate();
  const reset = useResetPassword();

  const form = useForm<TResetForm>({
    resolver: zodResolver(resetFormSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirm_password: '' },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    try {
      await reset.mutateAsync({ token, newPassword: password });
      toast.success('Password updated! Redirecting to login...');
      await navigate({ to: '/auth/login' });
    } catch (err) {
      toast.error(
        errorMessage(err, 'Link reset password tidak valid atau kedaluwarsa')
      );
    }
  });

  return { form, onSubmit, isLoading: reset.isPending };
};
