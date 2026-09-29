import { zodResolver } from '@hookform/resolvers/zod';
import { useSignUp } from '@imphnen-frontend-service/service/session';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  registerFormSchema,
  type TRegisterForm,
  type TFormSubmit,
} from './auth-schemas';
import { type TVerifyEmail, useVerifyEmail } from './use-verify-email';

type TRegister = TVerifyEmail & {
  form: UseFormReturn<TRegisterForm>;
  onSubmit: TFormSubmit;
  isRegistering: boolean;
};

export const useRegister = (onVerified: () => void): TRegister => {
  const signUp = useSignUp();
  const verifyEmail = useVerifyEmail(onVerified);

  const form = useForm<TRegisterForm>({
    resolver: zodResolver(registerFormSchema),
    mode: 'all',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(({ name, email, password }) => {
    signUp.mutate(
      { name, email, password },
      {
        onSuccess: () => {
          toast.success('Registrasi sukses. Silakan verifikasi email Anda.');
          form.reset();
          verifyEmail.openVerifyModal(email, false);
        },
        onError: (error) => toast.error(error.message || 'Registrasi gagal'),
      }
    );
  });

  return {
    ...verifyEmail,
    form,
    onSubmit,
    isRegistering: signUp.isPending,
  };
};
