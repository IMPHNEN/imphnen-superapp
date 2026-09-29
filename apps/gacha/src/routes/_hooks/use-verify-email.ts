import { zodResolver } from '@hookform/resolvers/zod';
import {
  useSendVerificationOtp,
  useVerifyEmailOtp,
} from '@imphnen-frontend-service/service/session';
import { useState } from 'react';
import { type UseFormReturn, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  type TVerifyEmailForm,
  verifyEmailFormSchema,
  type TFormSubmit,
} from './auth-schemas';

export type TVerifyEmail = {
  verifyForm: UseFormReturn<TVerifyEmailForm>;
  onVerifySubmit: TFormSubmit;
  showVerifyModal: boolean;
  openVerifyModal: (email: string, sendOtp: boolean) => void;
  closeVerifyModal: () => void;
  resendOtp: () => void;
  isVerifying: boolean;
  isResending: boolean;
  emailToVerify: string;
};

export const useVerifyEmail = (onVerified: () => void): TVerifyEmail => {
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState('');
  const verifyOtp = useVerifyEmailOtp();
  const sendOtp = useSendVerificationOtp();

  const verifyForm = useForm<TVerifyEmailForm>({
    resolver: zodResolver(verifyEmailFormSchema),
    mode: 'all',
    defaultValues: { otp: '' },
  });

  const closeVerifyModal = (): void => {
    setShowVerifyModal(false);
    verifyForm.reset();
  };

  const onVerifySubmit = verifyForm.handleSubmit(({ otp }) => {
    verifyOtp.mutate(
      { email: emailToVerify, otp },
      {
        onSuccess: () => {
          toast.success('Verifikasi email sukses');
          closeVerifyModal();
          onVerified();
        },
        onError: (error) =>
          toast.error(error.message || 'Verifikasi email gagal'),
      }
    );
  });

  const sendOtpTo = (email: string): void => {
    sendOtp.mutate(
      { email },
      {
        onSuccess: () => toast.success(`Kode OTP dikirim ke ${email}`),
        onError: (error) =>
          toast.error(error.message || 'Gagal mengirim kode OTP'),
      }
    );
  };

  /** Sign-up already mails an OTP; an unverified sign-in needs a new one. */
  const openVerifyModal = (email: string, shouldSendOtp: boolean): void => {
    setEmailToVerify(email);
    setShowVerifyModal(true);
    if (shouldSendOtp) sendOtpTo(email);
  };

  return {
    verifyForm,
    onVerifySubmit,
    showVerifyModal,
    openVerifyModal,
    closeVerifyModal,
    resendOtp: (): void => sendOtpTo(emailToVerify),
    isVerifying: verifyOtp.isPending,
    isResending: sendOtp.isPending,
    emailToVerify,
  };
};
