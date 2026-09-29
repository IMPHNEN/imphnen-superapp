import type {
  TLegacyMentor,
  TLegacySession,
} from '../../legacy/legacy-rows.ts';
import { fixtureId, T0, T1, T2 } from '../fixture-builders.ts';
import { USER_ID } from './iam-fixture.ts';

export const MENTOR_ID = {
  BUDI: fixtureId(301),
  RENAMED: fixtureId(302),
  ORPHAN: fixtureId(303),
  FORMER: fixtureId(304),
} as const;

export const SESSION_ID = {
  DIRECT: fixtureId(401),
  REPAIRED: fixtureId(402),
  UNRESOLVED: fixtureId(403),
  MENTEE_MISSING: fixtureId(404),
  ONGOING: fixtureId(405),
} as const;

export const MISSING_USER_ID = fixtureId(999);

const legacyMentor = (
  partial: Partial<TLegacyMentor> & Pick<TLegacyMentor, 'id' | 'user_id'>
): TLegacyMentor => ({
  industries: '["Software","Education"]',
  expertise: '["Rust","Microservices"]',
  languages: '["Indonesian","English"]',
  current_company: 'PT Contoh',
  current_role: 'Senior Backend Engineer',
  years_of_experience: 5,
  topics_of_interest: '["Rust Programming"]',
  preferred_mentee_level: '["beginner","junior"]',
  preferred_mentoring_formats: '["online","offline"]',
  availability_commitment: '2 jam per minggu',
  mentoring_rate: 100000,
  status: 'active',
  is_deleted: false,
  created_at: T0,
  updated_at: T1,
  ...partial,
});

export const MENTORS: readonly TLegacyMentor[] = [
  legacyMentor({
    id: MENTOR_ID.BUDI,
    user_id: USER_ID.MENTOR,
    status: 'verified',
    preferred_mentee_level: 'beginner',
    mentoring_rate: 100000.4,
    industries: '["Software",7]',
    current_company: '',
  }),
  legacyMentor({ id: MENTOR_ID.RENAMED, user_id: USER_ID.RENAMED }),
  legacyMentor({
    id: null,
    user_id: USER_ID.APPLICANT,
    status: null,
    preferred_mentee_level: '',
    industries: null,
    mentoring_rate: null,
  }),
  legacyMentor({ id: MENTOR_ID.ORPHAN, user_id: MISSING_USER_ID }),
  legacyMentor({
    id: MENTOR_ID.FORMER,
    user_id: USER_ID.FORMER_MENTOR,
    status: 'suspended',
    is_deleted: true,
    updated_at: T2,
  }),
];

const legacySession = (
  partial: Partial<TLegacySession> & Pick<TLegacySession, 'id' | 'mentor_id'>
): TLegacySession => ({
  mentee_id: USER_ID.MENTEE,
  topic: 'Belajar Rust dari nol',
  description: null,
  scheduled_at: T2,
  duration_minutes: 60,
  meeting_link: null,
  session_type: 'video_call',
  status: 'pending',
  feedback: null,
  rating: null,
  feedback_submitted_at: null,
  created_at: T1,
  updated_at: T1,
  ...partial,
});

export const SESSIONS: readonly TLegacySession[] = [
  legacySession({
    id: SESSION_ID.DIRECT,
    mentor_id: USER_ID.MENTOR,
    status: 'completed',
    rating: 5,
    feedback: 'Mantap sekali sesinya',
    feedback_submitted_at: T2,
    session_type: 'offline',
  }),
  legacySession({
    id: SESSION_ID.REPAIRED,
    mentor_id: MENTOR_ID.BUDI,
    status: 'canceled',
    session_type: 'online',
  }),
  legacySession({ id: SESSION_ID.UNRESOLVED, mentor_id: fixtureId(998) }),
  legacySession({
    id: SESSION_ID.MENTEE_MISSING,
    mentor_id: USER_ID.MENTOR,
    mentee_id: MISSING_USER_ID,
  }),
  legacySession({
    id: SESSION_ID.ONGOING,
    mentor_id: MENTOR_ID.RENAMED,
    status: 'ongoing',
    rating: 7,
  }),
];
