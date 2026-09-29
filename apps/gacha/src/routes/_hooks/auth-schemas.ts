import type { BaseSyntheticEvent } from 'react';
import { z } from 'zod';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export const loginFormSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
export type TLoginForm = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
    email: z.email('Email tidak valid'),
    password: z
      .string()
      .min(PASSWORD_MIN, `Password minimal ${PASSWORD_MIN} karakter`)
      .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: 'Password tidak sama',
    path: ['confirmPassword'],
  });
export type TRegisterForm = z.infer<typeof registerFormSchema>;

export const verifyEmailFormSchema = z.object({
  otp: z.string().trim().min(1, 'Kode OTP wajib diisi'),
});
export type TVerifyEmailForm = z.infer<typeof verifyEmailFormSchema>;

export const forgotPasswordFormSchema = z.object({
  email: z.email('Email tidak valid'),
});
export type TForgotPasswordForm = z.infer<typeof forgotPasswordFormSchema>;

export const resetPasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN, `Password minimal ${PASSWORD_MIN} karakter`)
      .max(PASSWORD_MAX, `Password maksimal ${PASSWORD_MAX} karakter`),
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: 'Password tidak sama',
    path: ['confirmPassword'],
  });
export type TResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;

/** What `form.handleSubmit(...)` returns; pass it straight to `<form onSubmit>`. */
export type TFormSubmit = (event?: BaseSyntheticEvent) => Promise<void>;
