import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForgotPassword,
  useResetPassword,
} from '@imphnen-frontend-service/service/session';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  forgotPasswordFormSchema,
  resetPasswordFormSchema,
  type TForgotPasswordForm,
  type TFormSubmit,
  type TResetPasswordForm,
} from './auth-schemas';

export const RESET_PASSWORD_PATH = '/reset-password';

type TForgotPasswordRequest = {
  form: UseFormReturn<TForgotPasswordForm>;
  onSubmit: TFormSubmit;
  isPending: boolean;
};

export const useForgotPasswordRequest = (
  onSent: () => void
): TForgotPasswordRequest => {
  const forgotPassword = useForgotPassword();
  const form = useForm<TForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordFormSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(({ email }) => {
    forgotPassword.mutate(
      {
        email,
        redirectTo: `${window.location.origin}${RESET_PASSWORD_PATH}`,
      },
      {
        onSuccess: onSent,
        onError: (error) =>
          toast.error(error.message || 'Gagal mengirim link reset password'),
      }
    );
  });

  return { form, onSubmit, isPending: forgotPassword.isPending };
};

type TPasswordResetForm = {
  form: UseFormReturn<TResetPasswordForm>;
  onSubmit: TFormSubmit;
  isPending: boolean;
};

export const usePasswordResetForm = (
  token: string,
  onDone: () => void
): TPasswordResetForm => {
  const resetPassword = useResetPassword();
  const form = useForm<TResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(({ newPassword }) => {
    resetPassword.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          toast.success('Password berhasil diubah. Silakan login.');
          onDone();
        },
        onError: (error) =>
          toast.error(error.message || 'Link reset password tidak valid'),
      }
    );
  });

  return { form, onSubmit, isPending: resetPassword.isPending };
};
