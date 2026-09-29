import { PERMISSION } from '@app/permissions';
import { A } from '@mobily/ts-belt';
import type {
  TLegacyQrCampaign,
  TLegacyQrUser,
} from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE } from '../../pipeline/report-codes.ts';
import {
  FILE_SOURCE_KIND,
  type TAdjustment,
  type TFileCopy,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
} from '../../shared/step-output.ts';
import type { TCustomRoleRow, TUserRow } from '../../target/target-rows.ts';
import type { TQrCampaignRow } from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { fileCopyOf, valueRef } from '../shared/legacy-file.ts';
import {
  adminGrant,
  type TAdminGrant,
  type TGrantee,
} from '../shared/role-grant.ts';

const QR_IMAGE_PREFIX = 'qr/campaign/';
const QR_IMAGE_EXTENSION = '.png';
const QR_IMAGE_COLUMN = 'qr_image_key';
const LEGACY_QR_ADMIN = 'admin';
const DAY_MS = 86_400_000;
const LEGACY_LIFETIME_DAYS = 30;
const SQL_TRUE = 1;
const SQL_FALSE = 0;

export const QR_ADMIN_GRANT: TAdminGrant = {
  table: LEGACY_TABLE.QR_USERS,
  why: 'qr_users admin',
  permissions: [
    PERMISSION.QR_CAMPAIGN_CREATE,
    PERMISSION.QR_CAMPAIGN_READ,
    PERMISSION.QR_CAMPAIGN_UPDATE,
    PERMISSION.QR_CAMPAIGN_DELETE,
  ],
  forUser: { key: 'qr_admin', label: 'QR admin' },
  forMentor: { key: 'qr_admin_mentor', label: 'QR admin (mentor)' },
};

const activeWinner = (campaigns: readonly TLegacyQrCampaign[]): string | null =>
  A.head(
    A.sort(
      A.filter(campaigns, (campaign): boolean => campaign.is_active),
      (left, right): number =>
        (right.updated_at ?? 0) - (left.updated_at ?? 0) ||
        (right.created_at ?? 0) - (left.created_at ?? 0)
    )
  )?.id ?? null;

const campaignOutput = (
  campaign: TLegacyQrCampaign,
  winner: string | null,
  userIds: ReadonlySet<string>
): TStepOutput => {
  const key =
    campaign.qr_code_base64 === null
      ? null
      : `${QR_IMAGE_PREFIX}${campaign.id}${QR_IMAGE_EXTENSION}`;
  const createdAt =
    campaign.created_at ?? campaign.expires_at - LEGACY_LIFETIME_DAYS * DAY_MS;
  const creator =
    campaign.created_by !== null && userIds.has(campaign.created_by)
      ? campaign.created_by
      : null;
  const row: TQrCampaignRow = {
    id: campaign.id,
    name: campaign.name,
    url: campaign.url,
    qr_image_key: key,
    is_active: campaign.id === winner ? SQL_TRUE : SQL_FALSE,
    created_by: creator,
    expires_at: campaign.expires_at,
    created_at: createdAt,
    updated_at: campaign.updated_at ?? createdAt,
  };
  const files: readonly TFileCopy[] =
    key === null || campaign.qr_code_base64 === null
      ? []
      : [
          fileCopyOf(
            key,
            { kind: FILE_SOURCE_KIND.INLINE, base64: campaign.qr_code_base64 },
            [
              valueRef(
                TARGET_TABLE.QR_CAMPAIGN,
                campaign.id,
                QR_IMAGE_COLUMN,
                key,
                null
              ),
            ]
          ),
        ];
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.QR_CAMPAIGNS, campaign.id, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.QR_CAMPAIGN, rows: [row] }],
    files,
    adjustments: [
      ...(campaign.is_active && campaign.id !== winner
        ? [note(ADJUSTMENT_RULE.QR_ACTIVE_DEMOTED, `kept ${winner} active`)]
        : []),
      ...(campaign.created_by !== null && creator === null
        ? [
            note(
              ADJUSTMENT_RULE.QR_CREATOR_CLEARED,
              `user ${campaign.created_by}`
            ),
          ]
        : []),
    ],
  });
};

export const qrCampaignsTransform = (
  campaigns: readonly TLegacyQrCampaign[],
  userIds: ReadonlySet<string>
): TStepOutput => {
  const winner = activeWinner(campaigns);
  return outputsMerge(
    A.map(
      campaigns,
      (campaign): TStepOutput => campaignOutput(campaign, winner, userIds)
    )
  );
};

export const qrAdminsTransform = (
  qrUsers: readonly TLegacyQrUser[],
  users: ReadonlyMap<string, TUserRow>,
  existingRoles: readonly TCustomRoleRow[],
  now: number
): TStepOutput =>
  adminGrant(
    QR_ADMIN_GRANT,
    A.map(
      A.filter(qrUsers, (row): boolean => row.role === LEGACY_QR_ADMIN),
      (row): TGrantee => ({ legacyId: row.id, userId: row.id })
    ),
    users,
    existingRoles,
    now
  );
