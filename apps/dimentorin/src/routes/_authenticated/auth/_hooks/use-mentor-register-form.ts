import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type TMentorRegisterInput,
  useApplyAsMentor,
} from './use-mentor-application';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];
export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
export const OTHER_TOPIC = 'Other';

const optionalText = z.string().trim().max(200);
const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === '' || /^https?:\/\/\S+$/.test(value), {
    message: 'URL harus diawali http:// atau https://',
  });

/** A whole number typed in a text input ("500.000" is accepted). */
const integerText = z
  .string()
  .trim()
  .transform((value) => value.replace(/[.,\s]/g, ''))
  .refine((value) => /^\d+$/.test(value), 'Isi dengan angka')
  .transform(Number);

const documentSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Ukuran file maksimal 5MB')
  .refine(
    (file) => DOCUMENT_TYPES.includes(file.type),
    'Format file harus PDF, JPG, PNG, atau WebP'
  );

export const STEP_FIELDS = {
  1: ['legalName', 'gender', 'phoneNumber', 'domicile', 'lastEducation'],
  2: [
    'currentCompany',
    'currentRole',
    'yearsOfExperience',
    'topic',
    'otherTopic',
    'skills',
  ],
  3: [
    'availabilityCommitment',
    'mentoringFormat',
    'cv',
    'portfolioUrl',
    'mentoringRate',
  ],
  4: ['bio', 'linkedinUrl', 'githubUrl', 'identity'],
} as const;

export const mentorRegisterFormSchema = z
  .object({
    legalName: z.string().trim().min(3, 'Nama lengkap minimal 3 karakter'),
    gender: optionalText,
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || /^\+?\d{10,15}$/.test(value),
        'Nomor telepon 10-15 digit'
      ),
    domicile: optionalText,
    lastEducation: optionalText,
    currentCompany: z.string().trim().min(1, 'Perusahaan wajib diisi'),
    currentRole: z.string().trim().min(1, 'Jabatan wajib diisi'),
    yearsOfExperience: integerText.pipe(
      z
        .number()
        .min(2, 'Minimal 2 tahun pengalaman')
        .max(60, 'Maksimal 60 tahun')
    ),
    topic: z.string().min(1, 'Pilih topik keahlian'),
    otherTopic: optionalText,
    skills: z.string().trim().min(1, 'Isi minimal satu skill'),
    availabilityCommitment: z.string().min(5, 'Pilih komitmen waktu'),
    mentoringFormat: z.string().min(1, 'Pilih format pengajaran'),
    cv: documentSchema.nullable(),
    portfolioUrl: optionalUrl,
    mentoringRate: integerText.pipe(
      z
        .number()
        .min(1, 'Honorarium wajib diisi')
        .max(100_000_000, 'Honorarium terlalu besar')
    ),
    bio: z
      .string()
      .trim()
      .min(50, 'Ceritakan dirimu minimal 50 karakter')
      .max(2000, 'Maksimal 2000 karakter'),
    linkedinUrl: optionalUrl,
    githubUrl: optionalUrl,
    identity: documentSchema.nullable().refine((file) => file !== null, {
      message: 'Dokumen identitas wajib diunggah',
    }),
  })
  .refine(
    (data) => data.topic !== OTHER_TOPIC || data.otherTopic.trim().length > 0,
    { message: 'Tulis topik yang kamu kuasai', path: ['otherTopic'] }
  );

export type TMentorRegisterForm = z.input<typeof mentorRegisterFormSchema>;
type TMentorRegisterValues = z.output<typeof mentorRegisterFormSchema>;

const orNull = (value: string): string | null =>
  value.trim() === '' ? null : value.trim();

const tags = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

const toRegisterInput = (
  values: TMentorRegisterValues
): TMentorRegisterInput => {
  const topic =
    values.topic === OTHER_TOPIC ? values.otherTopic.trim() : values.topic;
  return {
    legalName: values.legalName,
    gender: orNull(values.gender),
    phoneNumber: orNull(values.phoneNumber),
    domicile: orNull(values.domicile),
    lastEducation: orNull(values.lastEducation),
    currentCompany: values.currentCompany,
    currentRole: values.currentRole,
    yearsOfExperience: values.yearsOfExperience,
    topicsOfInterest: [topic],
    expertise: tags(values.skills),
    industries: [],
    languages: [],
    preferredMenteeLevel: [],
    preferredMentoringFormats: [values.mentoringFormat],
    availabilityCommitment: values.availabilityCommitment,
    mentoringRate: values.mentoringRate,
    bio: values.bio,
    portfolioUrl: orNull(values.portfolioUrl),
    linkedinUrl: orNull(values.linkedinUrl),
    githubUrl: orNull(values.githubUrl),
  };
};

export const useMentorRegisterForm = () => {
  const navigate = useNavigate();
  const apply = useApplyAsMentor();

  const form = useForm<TMentorRegisterForm, unknown, TMentorRegisterValues>({
    resolver: zodResolver(mentorRegisterFormSchema),
    mode: 'onTouched',
    defaultValues: {
      legalName: '',
      gender: '',
      phoneNumber: '',
      domicile: '',
      lastEducation: '',
      currentCompany: '',
      currentRole: '',
      yearsOfExperience: '',
      topic: '',
      otherTopic: '',
      skills: '',
      availabilityCommitment: '',
      mentoringFormat: '',
      cv: null,
      portfolioUrl: '',
      mentoringRate: '',
      bio: '',
      linkedinUrl: '',
      githubUrl: '',
      identity: null,
    },
  });

  const validateStep = (step: keyof typeof STEP_FIELDS): Promise<boolean> =>
    form.trigger([...STEP_FIELDS[step]]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.identity) return;
    try {
      await apply.mutateAsync({
        profile: toRegisterInput(values),
        cv: values.cv,
        identity: values.identity,
      });
      await navigate({ to: '/auth/register-mentor/pending' });
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : 'Gagal mengirim pendaftaran mentor'
      );
    }
  });

  return {
    form,
    onSubmit,
    validateStep,
    isSubmitting: apply.isPending,
  };
};
