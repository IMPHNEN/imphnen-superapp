import { zodResolver } from '@hookform/resolvers/zod';
import { useSignIn } from '@imphnen-frontend-service/service/session';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  loginFormSchema,
  type TLoginForm,
  type TFormSubmit,
} from './auth-schemas';
import { type TVerifyEmail, useVerifyEmail } from './use-verify-email';

const EMAIL_NOT_VERIFIED = /not verified/i;

type TLogin = TVerifyEmail & {
  form: UseFormReturn<TLoginForm>;
  onSubmit: TFormSubmit;
  isLoading: boolean;
};

export const useLogin = (onSignedIn: () => void): TLogin => {
  const form = useForm<TLoginForm>({
    resolver: zodResolver(loginFormSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });
  const signIn = useSignIn();
  const verifyEmail = useVerifyEmail(onSignedIn);

  const onSubmit = form.handleSubmit((data) => {
    signIn.mutate(data, {
      onSuccess: () => {
        toast.success('Login sukses');
        form.reset();
        onSignedIn();
      },
      onError: (error) => {
        if (EMAIL_NOT_VERIFIED.test(error.message)) {
          toast.error('Akun belum aktif, silakan verifikasi email Anda');
          verifyEmail.openVerifyModal(data.email, true);
          return;
        }
        toast.error(error.message || 'Terjadi Kesalahan yang tidak diketahui');
      },
    });
  });

  return {
    ...verifyEmail,
    form,
    onSubmit,
    isLoading: signIn.isPending,
  };
};
