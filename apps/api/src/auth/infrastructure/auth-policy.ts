import type { BetterAuthOptions, BetterAuthPlugin } from 'better-auth';
import { emailOTP } from 'better-auth/plugins';
import type { TOtpMail } from '#/auth/infrastructure/otp-mail.ts';

const SECONDS_PER_MINUTE = 60;

export const OTP_POLICY = {
  LENGTH: 6,
  EXPIRES_SECONDS: 5 * SECONDS_PER_MINUTE,
  ALLOWED_ATTEMPTS: 5,
  STORE: 'hashed',
} as const;

export const RATE_LIMIT_POLICY = {
  WINDOW_SECONDS: SECONDS_PER_MINUTE,
  MAX: 100,
  OTP_VERIFY_WINDOW_SECONDS: SECONDS_PER_MINUTE,
  OTP_VERIFY_MAX: 10,
  SIGN_IN_WINDOW_SECONDS: SECONDS_PER_MINUTE,
  SIGN_IN_MAX: 30,
  SIGN_UP_WINDOW_SECONDS: SECONDS_PER_MINUTE,
  SIGN_UP_MAX: 20,
  STORAGE: 'database',
  MODEL: 'rateLimit',
} as const;

export const CLIENT_IP_HEADER = 'cf-connecting-ip';

export const AUTH_PATH = {
  SIGN_IN_EMAIL: '/sign-in/email',
  SIGN_UP_EMAIL: '/sign-up/email',
  OTP_VERIFY_EMAIL: '/email-otp/verify-email',
  OTP_SIGN_IN: '/sign-in/email-otp',
  OTP_REQUEST_PASSWORD_RESET: '/email-otp/request-password-reset',
  OTP_FORGET_PASSWORD: '/forget-password/email-otp',
  OTP_RESET_PASSWORD: '/email-otp/reset-password',
  OTP_REQUEST_EMAIL_CHANGE: '/email-otp/request-email-change',
  OTP_CHANGE_EMAIL: '/email-otp/change-email',
} as const;

export const AUTH_DISABLED_PATHS: string[] = [
  AUTH_PATH.OTP_SIGN_IN,
  AUTH_PATH.OTP_REQUEST_PASSWORD_RESET,
  AUTH_PATH.OTP_FORGET_PASSWORD,
  AUTH_PATH.OTP_RESET_PASSWORD,
  AUTH_PATH.OTP_REQUEST_EMAIL_CHANGE,
  AUTH_PATH.OTP_CHANGE_EMAIL,
];

export const authRateLimitOf = (): BetterAuthOptions['rateLimit'] => ({
  enabled: true,
  storage: RATE_LIMIT_POLICY.STORAGE,
  modelName: RATE_LIMIT_POLICY.MODEL,
  window: RATE_LIMIT_POLICY.WINDOW_SECONDS,
  max: RATE_LIMIT_POLICY.MAX,
  customRules: {
    [AUTH_PATH.SIGN_IN_EMAIL]: {
      window: RATE_LIMIT_POLICY.SIGN_IN_WINDOW_SECONDS,
      max: RATE_LIMIT_POLICY.SIGN_IN_MAX,
    },
    [AUTH_PATH.SIGN_UP_EMAIL]: {
      window: RATE_LIMIT_POLICY.SIGN_UP_WINDOW_SECONDS,
      max: RATE_LIMIT_POLICY.SIGN_UP_MAX,
    },
    [AUTH_PATH.OTP_VERIFY_EMAIL]: {
      window: RATE_LIMIT_POLICY.OTP_VERIFY_WINDOW_SECONDS,
      max: RATE_LIMIT_POLICY.OTP_VERIFY_MAX,
    },
  },
});

export const emailOtpPluginOf = (
  otpSend: (mail: TOtpMail) => Promise<void>
): BetterAuthPlugin =>
  emailOTP({
    otpLength: OTP_POLICY.LENGTH,
    expiresIn: OTP_POLICY.EXPIRES_SECONDS,
    allowedAttempts: OTP_POLICY.ALLOWED_ATTEMPTS,
    storeOTP: OTP_POLICY.STORE,
    disableSignUp: true,
    overrideDefaultEmailVerification: true,
    sendVerificationOTP: (data): Promise<void> =>
      otpSend({ to: data.email, otp: data.otp, type: data.type }),
  });
