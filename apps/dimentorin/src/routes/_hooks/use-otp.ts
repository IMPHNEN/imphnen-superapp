import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useVerifyEmailOtp } from '@imphnen-frontend-service/service/session';
import { errorMessage, otpFormSchema, type TOtpForm } from './auth-schemas';

export const useOtpHook = (email: string) => {
  const navigate = useNavigate();
  const verify = useVerifyEmailOtp();

  const form = useForm<TOtpForm>({
    resolver: zodResolver(otpFormSchema),
    mode: 'all',
    defaultValues: { otp: '' },
  });

  const onSubmit = form.handleSubmit(async ({ otp }) => {
    try {
      await verify.mutateAsync({ email, otp });
      await navigate({ to: '/auth/register/success' });
    } catch (err) {
      toast.error(errorMessage(err, 'Kode OTP tidak valid'));
    }
  });

  return {
    form,
    onSubmit,
    isLoading: verify.isPending,
  };
};
