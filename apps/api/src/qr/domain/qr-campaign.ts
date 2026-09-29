import type { TQrCampaignListInput } from '@app/schemas';
import { Context, type Effect } from 'effect';
import type { TBaseRow } from '#/shared/base-row.ts';
import type { EDatabase } from '#/shared/errors.ts';
import type { TRowPage } from '#/shared/pagination.ts';
import { REPO_TAG } from '#/shared/repo-tags.ts';
import type { TServiceId } from '#/shared/service-id.ts';

export type TQrCampaignRow = TBaseRow & {
  name: string;
  url: string;
  qrImageKey: string | null;
  isActive: boolean;
  createdBy: string | null;
  expiresAt: Date;
};

export type TQrCampaignWrite = Pick<
  TQrCampaignRow,
  'name' | 'url' | 'createdBy' | 'expiresAt'
>;

export type TQrCampaignRepo = {
  list: (
    input: TQrCampaignListInput
  ) => Effect.Effect<TRowPage<TQrCampaignRow>, EDatabase>;
  findById: (id: string) => Effect.Effect<TQrCampaignRow | null, EDatabase>;
  findActive: (now: Date) => Effect.Effect<TQrCampaignRow | null, EDatabase>;
  createActive: (
    values: TQrCampaignWrite
  ) => Effect.Effect<TQrCampaignRow, EDatabase>;
  activate: (
    id: string,
    now: Date
  ) => Effect.Effect<TQrCampaignRow | null, EDatabase>;
  remove: (id: string) => Effect.Effect<TQrCampaignRow | null, EDatabase>;
};

export type TQrCampaignRepoId = TServiceId<typeof REPO_TAG.QR_CAMPAIGN>;

export const QrCampaignRepo = Context.Service<
  TQrCampaignRepoId,
  TQrCampaignRepo
>(REPO_TAG.QR_CAMPAIGN);
