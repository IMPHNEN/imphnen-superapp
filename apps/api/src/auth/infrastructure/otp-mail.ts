import { AUTH_MESSAGE } from '@app/messages';
import { match } from 'ts-pattern';
import { mailHtmlBuild, mailTextBuild } from '#/platform/mail/mail-body.ts';
import type { TMailMessage } from '#/platform/mail/mail-service.ts';

export const OTP_TYPE = {
  SIGN_IN: 'sign-in',
  EMAIL_VERIFICATION: 'email-verification',
  FORGET_PASSWORD: 'forget-password',
  CHANGE_EMAIL: 'change-email',
} as const;

export type TOtpType = (typeof OTP_TYPE)[keyof typeof OTP_TYPE];

export type TOtpMail = {
  readonly to: string;
  readonly otp: string;
  readonly type: TOtpType;
};

export type TOtpMailInput = TOtpMail & { readonly brand: string };

const subjectOf = (type: TOtpType): string =>
  match(type)
    .with(OTP_TYPE.SIGN_IN, (): string => AUTH_MESSAGE.OTP_SUBJECT_SIGN_IN)
    .with(
      OTP_TYPE.EMAIL_VERIFICATION,
      (): string => AUTH_MESSAGE.OTP_SUBJECT_VERIFY
    )
    .with(
      OTP_TYPE.FORGET_PASSWORD,
      (): string => AUTH_MESSAGE.OTP_SUBJECT_PASSWORD
    )
    .with(
      OTP_TYPE.CHANGE_EMAIL,
      (): string => AUTH_MESSAGE.OTP_SUBJECT_EMAIL_CHANGE
    )
    .exhaustive();

const linesOf = (input: TOtpMailInput): readonly string[] => [
  AUTH_MESSAGE.OTP_GREETING,
  AUTH_MESSAGE.OTP_BODY,
  input.otp,
  AUTH_MESSAGE.OTP_EXPIRY,
  `${AUTH_MESSAGE.OTP_SIGNATURE_PREFIX} ${input.brand}`,
];

export const otpMailBuild = (input: TOtpMailInput): TMailMessage => ({
  to: input.to,
  subject: subjectOf(input.type),
  text: mailTextBuild(linesOf(input)),
  html: mailHtmlBuild(linesOf(input)),
});
