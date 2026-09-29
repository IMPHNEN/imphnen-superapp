import type {
  TLegacyGachaClaim,
  TLegacyGachaCredit,
  TLegacyGachaItem,
  TLegacyGachaPoolEntry,
} from '../../legacy/legacy-rows.ts';
import { fixtureId, T0, T1, T2 } from '../fixture-builders.ts';
import { MISSING_USER_ID } from './dimentorin-fixture.ts';
import { USER_ID } from './iam-fixture.ts';

export const ITEM_ID = {
  TUMBLER: fixtureId(501),
  STICKER: fixtureId(502),
  BROKEN: fixtureId(503),
  TEST: fixtureId(504),
  RETIRED: fixtureId(505),
  UNLINKED: fixtureId(506),
  MISSING: fixtureId(507),
} as const;

const legacyItem = (
  partial: Partial<TLegacyGachaItem> &
    Pick<TLegacyGachaItem, 'id' | 'item_code' | 'name'>
): TLegacyGachaItem => ({
  description: '',
  rarity: 'common',
  type: 'physical',
  category: 'merchandise',
  value: 0,
  weight: 0.5,
  stock: 10,
  is_limited: false,
  metadata: null,
  created_at: T0,
  updated_at: T0,
  deleted_at: null,
  ...partial,
});

export const GACHA_ITEMS: readonly TLegacyGachaItem[] = [
  legacyItem({
    id: ITEM_ID.TUMBLER,
    item_code: 'tumbler-imphnen',
    name: 'Tumbler IMPHNEN',
    metadata: '{"color":"black"}',
  }),
  legacyItem({
    id: ITEM_ID.STICKER,
    item_code: 'stiker',
    name: 'Stiker',
    metadata: 'null',
  }),
  legacyItem({
    id: ITEM_ID.BROKEN,
    item_code: 'kaos-rusak',
    name: 'Kaos',
    weight: -1,
    stock: -3,
  }),
  legacyItem({
    id: ITEM_ID.TEST,
    item_code: 'ITEM_TEST_1',
    name: 'Test Gacha Item',
    type: 'item',
    category: 'test',
    weight: 1,
    value: 1,
  }),
  legacyItem({
    id: ITEM_ID.RETIRED,
    item_code: 'lama',
    name: 'Hadiah Lama',
    deleted_at: T1,
  }),
];

const pool = (
  id: number,
  itemId: string,
  weight: number,
  quantity: number,
  isDeleted: boolean
): TLegacyGachaPoolEntry => ({
  id: fixtureId(id),
  item_id: itemId,
  weight,
  quantity,
  is_deleted: isDeleted,
  created_at: T1,
});

export const GACHA_POOL: readonly TLegacyGachaPoolEntry[] = [
  pool(601, ITEM_ID.TUMBLER, 1, 10, false),
  pool(602, ITEM_ID.TUMBLER, 0.5, 4, false),
  pool(603, ITEM_ID.STICKER, 1, 5, true),
  pool(604, ITEM_ID.TEST, 1, 0, false),
  pool(605, ITEM_ID.UNLINKED, 2, 3, false),
  pool(606, ITEM_ID.TEST, 1, 10, false),
];

const credit = (
  id: number,
  userId: string,
  rolls: number,
  isDeleted: boolean,
  createdAt: number | null
): TLegacyGachaCredit => ({
  id: fixtureId(id),
  user_id: userId,
  available_rolls: rolls,
  is_deleted: isDeleted,
  created_at: createdAt,
  updated_at: createdAt === null ? null : createdAt + 1000,
});

export const GACHA_CREDITS: readonly TLegacyGachaCredit[] = [
  credit(701, USER_ID.MENTEE, 3, false, T1),
  credit(702, USER_ID.MENTEE, 2, false, T0),
  credit(703, USER_ID.MENTEE, 50, true, T0),
  credit(704, USER_ID.CONTENT, -4, false, null),
  credit(705, MISSING_USER_ID, 1, false, T0),
];

const claim = (
  id: number,
  partial: Partial<TLegacyGachaClaim>
): TLegacyGachaClaim => ({
  id: fixtureId(id),
  user_id: USER_ID.MENTEE,
  gacha_item_id: ITEM_ID.TUMBLER,
  claim_type: 'roll',
  status: 'claimed',
  quantity: 1,
  metadata: null,
  claimed_at: T2,
  updated_at: T2,
  deleted_at: null,
  ...partial,
});

export const CLAIM_ID = {
  ROLL: fixtureId(801),
  STANDARD: fixtureId(802),
  DELETED: fixtureId(803),
  ITEM_MISSING: fixtureId(804),
  PLACEHOLDER: fixtureId(805),
  METADATA: fixtureId(806),
  USER_MISSING: fixtureId(807),
} as const;

export const GACHA_CLAIMS: readonly TLegacyGachaClaim[] = [
  claim(801, {}),
  claim(802, { claim_type: 'standard', gacha_item_id: ITEM_ID.STICKER }),
  claim(803, { deleted_at: T2 }),
  claim(804, { gacha_item_id: ITEM_ID.MISSING }),
  claim(805, { gacha_item_id: ITEM_ID.UNLINKED, claim_type: 'direct' }),
  claim(806, { metadata: '{"note":"manual"}', quantity: 0 }),
  claim(807, { user_id: MISSING_USER_ID }),
];
