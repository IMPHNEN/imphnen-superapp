import type {
  TLegacyEvent,
  TLegacyQrCampaign,
  TLegacyQrUser,
  TLegacyRoadmapItem,
  TLegacyTestimonial,
} from '../../legacy/legacy-rows.ts';
import { fixtureId, T0, T1, T2 } from '../fixture-builders.ts';
import { MISSING_USER_ID } from './dimentorin-fixture.ts';
import { USER_ID } from './iam-fixture.ts';

const DAY_MS = 86_400_000;
export const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNgAAAAAgABc3UBGAAAAABJRU5ErkJggg==';

export const EVENT_ID = {
  MEETUP: fixtureId(901),
  WORKSHOP: fixtureId(902),
  ODD: fixtureId(903),
} as const;
export const TESTIMONIAL_ID = {
  OK: fixtureId(911),
  ORPHAN: fixtureId(912),
  HIDDEN: fixtureId(913),
} as const;
export const ROADMAP_ID = {
  WIP: fixtureId(921),
  PLANNED: fixtureId(922),
} as const;
export const QR_ID = {
  OLD: fixtureId(931),
  NEW: fixtureId(932),
  DRAFT: fixtureId(933),
} as const;

const event = (
  id: string,
  price: number,
  isDeleted: boolean
): TLegacyEvent => ({
  id,
  name: 'Ngopi Bareng IMPHNEN',
  description: 'Kumpul santai',
  detail_link: 'https://imphnen.dev/events/ngopi',
  price,
  is_online: false,
  is_deleted: isDeleted,
  location: 'Jakarta',
  start_date: T1,
  end_date: T1 + 3 * 3_600_000,
  created_at: T0,
  updated_at: T2,
});

export const EVENTS: readonly TLegacyEvent[] = [
  event(EVENT_ID.MEETUP, 50000, false),
  event(EVENT_ID.WORKSHOP, 12.5, true),
  event(EVENT_ID.ODD, -10, false),
];

const testimonial = (
  id: string,
  userId: string,
  isDeleted: boolean
): TLegacyTestimonial => ({
  id,
  user_id: userId,
  role: 'Software Engineer',
  content: "Komunitas paling santai, it's great",
  is_deleted: isDeleted,
  created_at: T0,
  updated_at: T1,
});

export const TESTIMONIALS: readonly TLegacyTestimonial[] = [
  testimonial(TESTIMONIAL_ID.OK, USER_ID.MENTEE, false),
  testimonial(TESTIMONIAL_ID.ORPHAN, MISSING_USER_ID, false),
  testimonial(TESTIMONIAL_ID.HIDDEN, USER_ID.ADMIN, true),
];

export const ROADMAP_ITEMS: readonly TLegacyRoadmapItem[] = [
  {
    id: ROADMAP_ID.WIP,
    title: 'Dimentorin v2',
    description: 'Booking mentor',
    status: 'in_progress',
    votes: 42,
    is_deleted: false,
    created_at: T0,
    updated_at: T1,
  },
  {
    id: ROADMAP_ID.PLANNED,
    title: 'Gacha musim 2',
    description: 'Hadiah baru',
    status: 'planned',
    votes: 3,
    is_deleted: true,
    created_at: T0,
    updated_at: T2,
  },
];

export const QR_CAMPAIGNS: readonly TLegacyQrCampaign[] = [
  {
    id: QR_ID.OLD,
    name: 'Kampanye Lama',
    url: 'https://imphnen.dev/a',
    qr_code_base64: PNG_BASE64,
    is_active: true,
    created_by: USER_ID.QR_ADMIN,
    expires_at: T1 + 30 * DAY_MS,
    created_at: T1,
    updated_at: T1,
  },
  {
    id: QR_ID.NEW,
    name: 'Kampanye Baru',
    url: 'https://imphnen.dev/b',
    qr_code_base64: PNG_BASE64,
    is_active: true,
    created_by: USER_ID.QR_ADMIN,
    expires_at: T2 + 30 * DAY_MS,
    created_at: T2,
    updated_at: T2,
  },
  {
    id: QR_ID.DRAFT,
    name: 'Tanpa Pembuat',
    url: 'https://imphnen.dev/c',
    qr_code_base64: null,
    is_active: false,
    created_by: MISSING_USER_ID,
    expires_at: T2,
    created_at: null,
    updated_at: null,
  },
];

export const QR_USERS: readonly TLegacyQrUser[] = [
  { id: USER_ID.QR_ADMIN, email: 'qr@imphnen.dev', role: 'admin' },
  { id: USER_ID.ADMIN, email: 'admin@imphnen.dev', role: 'admin' },
  { id: USER_ID.MENTEE, email: 'mentee@imphnen.dev', role: 'user' },
  { id: MISSING_USER_ID, email: 'ghost@imphnen.dev', role: 'admin' },
];
