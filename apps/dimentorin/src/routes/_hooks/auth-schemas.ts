import { z } from 'zod';

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

export const OTP_LENGTH = 6;

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email tidak boleh kosong')
  .email('Email harus valid');

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, 'Password minimal 8 karakter')
  .max(PASSWORD_MAX, 'Password maksimal 128 karakter');

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password tidak boleh kosong'),
});
export type TLoginForm = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z
  .object({
    first_name: z.string().trim().min(1, 'Nama depan tidak boleh kosong'),
    last_name: z.string().trim().min(1, 'Nama belakang tidak boleh kosong'),
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z
      .string()
      .min(1, 'Konfirmasi password tidak boleh kosong'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Password tidak cocok',
    path: ['confirm_password'],
  });
export type TRegisterForm = z.infer<typeof registerFormSchema>;

export const otpFormSchema = z.object({
  otp: z
    .string()
    .trim()
    .length(OTP_LENGTH, 'Kode OTP harus 6 digit')
    .regex(/^\d+$/, 'Kode OTP hanya berisi angka'),
});
export type TOtpForm = z.infer<typeof otpFormSchema>;

export const forgotFormSchema = z.object({ email: emailSchema });
export type TForgotForm = z.infer<typeof forgotFormSchema>;

export const resetFormSchema = z
  .object({
    password: passwordSchema,
    confirm_password: z.string().min(1, 'Ulangi password baru'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Password tidak cocok',
    path: ['confirm_password'],
  });
export type TResetForm = z.infer<typeof resetFormSchema>;

export const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;
