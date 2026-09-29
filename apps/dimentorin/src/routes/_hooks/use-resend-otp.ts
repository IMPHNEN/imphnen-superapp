import { toast } from 'sonner';
import { useSendVerificationOtp } from '@imphnen-frontend-service/service/session';
import { errorMessage } from './auth-schemas';

export const useResendOtpHook = () => {
  const { mutate, isPending: isLoading } = useSendVerificationOtp();

  const resendOTP = (data: { email: string }) => {
    mutate(data, {
      onSuccess: () => toast.success('Kode OTP baru sudah dikirim!'),
      onError: (err) =>
        toast.error(errorMessage(err, 'Gagal mengirim ulang OTP')),
    });
  };

  return {
    resendOTP,
    isLoading,
  };
};
