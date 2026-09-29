export const MAIL_MESSAGE = {
  GREETING: 'Hi',
  SIGNATURE_PREFIX: '-',
  PASSWORD_RESET_SUBJECT: 'Reset your password',
  PASSWORD_RESET_BODY:
    'Someone asked to reset the password for your account. Use the link below to choose a new one.',
  PASSWORD_RESET_ACTION: 'Reset password',
  PASSWORD_RESET_EXPIRY:
    'This link expires in one hour. If you did not ask for it, you can safely ignore this email.',
  SEND_FAILED: 'Could not send an email.',
  PASSWORD_RESET_FAILED: 'Could not send the password reset email.',
} as const;
