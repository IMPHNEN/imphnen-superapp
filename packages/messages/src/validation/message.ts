export const VALIDATION_MESSAGE = {
  EMAIL_INVALID: 'Enter a valid email address.',
  PASSWORD_REQUIRED: 'Enter your password.',
  CURRENT_PASSWORD_REQUIRED: 'Enter your current password.',
  PASSWORD_TOO_SHORT: 'Use at least 8 characters.',
  PASSWORD_TOO_LONG: 'Use at most 128 characters.',
  ROLE_KEY_RESERVED: 'This key is reserved. Choose another one.',
  ROLE_KEY_FORMAT:
    'Use 2-50 lowercase letters, digits, hyphens or underscores, starting with a letter.',
  FILE_NAME_LENGTH: 'Use a file name between 1 and 255 characters.',
} as const;
