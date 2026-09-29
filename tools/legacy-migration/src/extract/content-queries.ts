import { LEGACY_TABLE } from '../legacy/legacy-table.ts';
import {
  bytesAsBase64,
  col,
  jsonAsText,
  ms,
  selectFrom,
} from './sql-fragments.ts';

const BY_CREATED = '"created_at", "id"';
const BY_ID = '"id"';

export const CONTENT_QUERIES = {
  [LEGACY_TABLE.APP_GACHA_ITEMS]: selectFrom(
    LEGACY_TABLE.APP_GACHA_ITEMS,
    [
      col('id'),
      col('item_code'),
      col('name'),
      col('description'),
      col('rarity'),
      col('type'),
      col('category'),
      col('value'),
      col('weight'),
      col('stock'),
      col('is_limited'),
      jsonAsText('metadata'),
      ms('created_at'),
      ms('updated_at'),
      ms('deleted_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.GACHA_ROLLS]: selectFrom(
    LEGACY_TABLE.GACHA_ROLLS,
    [
      col('id'),
      col('item_id'),
      `"weight"::float8 AS "weight"`,
      col('quantity'),
      col('is_deleted'),
      ms('created_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.GACHA_CREDITS]: selectFrom(
    LEGACY_TABLE.GACHA_CREDITS,
    [
      col('id'),
      col('user_id'),
      col('available_rolls'),
      col('is_deleted'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.APP_GACHA_CLAIMS]: selectFrom(
    LEGACY_TABLE.APP_GACHA_CLAIMS,
    [
      col('id'),
      col('user_id'),
      col('gacha_item_id'),
      col('claim_type'),
      col('status'),
      col('quantity'),
      jsonAsText('metadata'),
      ms('claimed_at'),
      ms('updated_at'),
      ms('deleted_at'),
    ],
    '"claimed_at", "id"'
  ),
  [LEGACY_TABLE.EVENTS]: selectFrom(
    LEGACY_TABLE.EVENTS,
    [
      col('id'),
      col('name'),
      col('description'),
      col('detail_link'),
      `"price"::float8 AS "price"`,
      col('is_online'),
      col('is_deleted'),
      col('location'),
      ms('start_date'),
      ms('end_date'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.TESTIMONIALS]: selectFrom(
    LEGACY_TABLE.TESTIMONIALS,
    [
      col('id'),
      col('user_id'),
      col('role'),
      col('content'),
      col('is_deleted'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.ROADMAP_ITEMS]: selectFrom(
    LEGACY_TABLE.ROADMAP_ITEMS,
    [
      col('id'),
      col('title'),
      col('description'),
      col('status'),
      col('votes'),
      col('is_deleted'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_CREATED
  ),
  [LEGACY_TABLE.QR_CAMPAIGNS]: selectFrom(
    LEGACY_TABLE.QR_CAMPAIGNS,
    [
      col('id'),
      col('name'),
      col('url'),
      bytesAsBase64('qr_code_data', 'qr_code_base64'),
      col('is_active'),
      col('created_by'),
      ms('expires_at'),
      ms('created_at'),
      ms('updated_at'),
    ],
    BY_ID
  ),
  [LEGACY_TABLE.QR_USERS]: selectFrom(
    LEGACY_TABLE.QR_USERS,
    [col('id'), col('email'), col('role')],
    BY_ID
  ),
} as const;
