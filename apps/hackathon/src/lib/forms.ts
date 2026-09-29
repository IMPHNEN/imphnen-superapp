import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email tidak boleh kosong')
    .email('Email harus valid'),
  password: z.string().min(1, 'Password tidak boleh kosong'),
});
export type TLoginForm = z.infer<typeof loginSchema>;

export const profileSchema = z.object({
  fullname: z.string().min(3, 'Nama lengkap minimal 3 karakter').max(100),
  location: z.string().min(1, 'Domisili harus diisi'),
  bio: z.string().max(500, 'Bio maksimal 500 karakter').optional(),
  skills: z.array(z.string()).optional(),
});
export type TProfileForm = z.infer<typeof profileSchema>;

export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const TEAM_VISIBILITY = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export const teamFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Nama tim minimal 3 karakter')
    .max(50, 'Nama tim maksimal 50 karakter'),
  description: z
    .string()
    .min(10, 'Deskripsi minimal 10 karakter')
    .max(500, 'Deskripsi maksimal 500 karakter'),
  city: z.string().min(1, 'Kota harus diisi'),
  visibility: z.enum([TEAM_VISIBILITY.PUBLIC, TEAM_VISIBILITY.PRIVATE], {
    message: 'Visibilitas tidak valid',
  }),
});
export type TTeamForm = z.infer<typeof teamFormSchema>;

export const TEAM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const optionalUrl = (message: string) =>
  z.string().url(message).optional().or(z.literal(''));

export const submissionFormSchema = z.object({
  projectName: z
    .string()
    .trim()
    .min(3, 'Nama project minimal 3 karakter')
    .max(100, 'Nama project maksimal 100 karakter'),
  description: z
    .string()
    .trim()
    .min(20, 'Deskripsi minimal 20 karakter')
    .max(2000, 'Deskripsi maksimal 2000 karakter'),
  repositoryUrl: z.string().url('URL repository tidak valid'),
  demoUrl: optionalUrl('URL demo tidak valid'),
  videoUrl: optionalUrl('URL video tidak valid'),
});
export type TSubmissionForm = z.infer<typeof submissionFormSchema>;

export const emptyToUndefined = (value: string | undefined) =>
  value ? value : undefined;

export const joinTeamSchema = z.object({
  message: z
    .string()
    .min(10, 'Pesan minimal 10 karakter')
    .max(200, 'Pesan maksimal 200 karakter'),
});
export type TJoinTeamForm = z.infer<typeof joinTeamSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email('Email tidak valid'),
});
export type TInviteMemberForm = z.infer<typeof inviteMemberSchema>;
