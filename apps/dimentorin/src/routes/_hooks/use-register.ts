import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useSignUp } from '@imphnen-frontend-service/service/session';
import {
  errorMessage,
  registerFormSchema,
  type TRegisterForm,
} from './auth-schemas';

export const useRegisterHook = () => {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TRegisterForm>({
    resolver: zodResolver(registerFormSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    setError(null);
    try {
      await signUp.mutateAsync({
        email: data.email,
        password: data.password,
        name: `${data.first_name} ${data.last_name}`.trim(),
      });
      toast.success('Kode OTP sudah dikirim ke email-mu!');
      await navigate({
        to: '/auth/register/otp',
        search: { email: data.email },
      });
    } catch (err) {
      setError(errorMessage(err, 'Registrasi gagal'));
    }
  });

  return {
    form,
    onSubmit,
    error,
    isLoading: signUp.isPending,
  };
};
