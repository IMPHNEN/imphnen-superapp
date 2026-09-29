import type { TLegacyUser } from '../../legacy/legacy-rows.ts';
import { T0, T1 } from '../fixture-builders.ts';
import { ROLE_ID, USER_ID } from './iam-fixture.ts';

export const ARGON_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$WmFrZUhhc2hGb3JUZXN0aW5nT25seUFhYWFhYWFhYWFhYQ';

export const VALID_METADATA = JSON.stringify({
  phone_number: '081234567890',
  gender: 'female',
  birthdate: '1998-04-12',
  domicile: 'Bandung',
  bio: 'Backend engineer yang suka ngopi.',
  last_education: null,
  linkedin_url: 'https://linkedin.com/in/budi',
  github_url: null,
  cv_url: 'https://cdn.imphnen.dev/imphnen-uploads/documents/u103/cv-budi.pdf',
  portfolio_url: null,
  website_url: null,
  twitter_url: null,
  location: 'Jakarta',
  skills: ['Rust', 'TypeScript'],
  experience: [
    {
      id: 'e1',
      company: 'PT Contoh',
      position: 'Engineer',
      duration: '2y',
      period: '2021-2023',
    },
  ],
  education: null,
  career_status: 'employed',
});

export const legacyUser = (
  partial: Partial<TLegacyUser> & Pick<TLegacyUser, 'id' | 'email'>
): TLegacyUser => ({
  password_hash: ARGON_HASH,
  role_id: ROLE_ID.USER,
  first_name: 'Anggota',
  last_name: '',
  avatar_url: null,
  is_verified: false,
  is_active: true,
  metadata: null,
  created_at: T0,
  updated_at: T1,
  deleted_at: null,
  ...partial,
});

export const IAM_USERS: readonly TLegacyUser[] = [
  legacyUser({
    id: USER_ID.ADMIN,
    email: 'Admin@Imphnen.dev ',
    role_id: ROLE_ID.ADMIN,
    first_name: 'Admin',
    last_name: 'Utama',
    is_verified: true,
    avatar_url:
      'https://cdn.imphnen.dev/imphnen-uploads/profiles/u101/abc-avatar.JPEG',
  }),
  legacyUser({
    id: USER_ID.STAF,
    email: 'staf@imphnen.dev',
    role_id: ROLE_ID.STAF,
    first_name: 'Staf',
    last_name: 'Satu',
  }),
  legacyUser({
    id: USER_ID.MENTOR,
    email: 'budi@imphnen.dev',
    role_id: ROLE_ID.MENTOR,
    first_name: 'Budi',
    last_name: 'Santoso Putra',
    metadata: VALID_METADATA,
  }),
  legacyUser({
    id: USER_ID.FORMER_MENTOR,
    email: 'mentor2@example.com',
    role_id: ROLE_ID.MENTOR,
    first_name: 'Mentor',
    last_name: 'Two',
  }),
  legacyUser({
    id: USER_ID.UNVERIFIED,
    email: 'baru@imphnen.dev',
    is_active: false,
    is_verified: false,
  }),
  legacyUser({
    id: USER_ID.DISABLED,
    email: 'blokir@imphnen.dev',
    is_active: false,
    is_verified: true,
  }),
  legacyUser({
    id: USER_ID.DELETED,
    email: 'hapus@imphnen.dev',
    deleted_at: T1,
    first_name: null,
    last_name: null,
  }),
  legacyUser({
    id: USER_ID.BROKEN_JSON,
    email: 'rusak@imphnen.dev',
    metadata: '{"skills": ["Go"',
  }),
  legacyUser({
    id: USER_ID.WRONG_SHAPE,
    email: 'bentuk@imphnen.dev',
    metadata: '{"experience":[{"id":"x","company":"Acme"}],"bio":"hi"}',
  }),
  legacyUser({
    id: USER_ID.CONTENT,
    email: 'konten@imphnen.dev',
    role_id: ROLE_ID.CONTENT,
  }),
  legacyUser({
    id: USER_ID.OPS,
    email: 'ops@imphnen.dev',
    role_id: ROLE_ID.OPS,
  }),
  legacyUser({
    id: USER_ID.RETIRED_ROLE,
    email: 'lama@imphnen.dev',
    role_id: ROLE_ID.RETIRED,
  }),
  legacyUser({
    id: USER_ID.NO_PASSWORD,
    email: 'tanpa-sandi@imphnen.dev',
    password_hash: '',
  }),
  legacyUser({
    id: USER_ID.MENTEE,
    email: 'mentee@imphnen.dev',
    first_name: 'Mentee',
    last_name: 'Rajin',
  }),
  legacyUser({
    id: USER_ID.QR_ADMIN,
    email: 'qr@imphnen.dev',
    first_name: 'Qori',
    last_name: '',
  }),
  legacyUser({
    id: USER_ID.SARI,
    email: 'sari@imphnen.dev',
    first_name: 'Sari',
    last_name: 'Dewi',
  }),
  legacyUser({
    id: USER_ID.RENAMED,
    email: 'ganti-email@imphnen.dev',
    first_name: 'Ganti',
    last_name: 'Email',
    role_id: ROLE_ID.MENTOR,
  }),
  legacyUser({
    id: USER_ID.APPLICANT,
    email: 'calon@imphnen.dev',
    first_name: 'Calon',
    last_name: 'Mentor',
  }),
];
