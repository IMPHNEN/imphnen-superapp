import { A, D } from '@mobily/ts-belt';
import { CMS_PERMISSION } from './catalog/cms.ts';
import { DIMENTORIN_PERMISSION } from './catalog/dimentorin.ts';
import { GACHA_PERMISSION } from './catalog/gacha.ts';
import { HACKATHON_PERMISSION } from './catalog/hackathon.ts';
import { IAM_PERMISSION } from './catalog/iam.ts';

export const PERMISSION = {
  ...IAM_PERMISSION,
  ...GACHA_PERMISSION,
  ...DIMENTORIN_PERMISSION,
  ...CMS_PERMISSION,
  ...HACKATHON_PERMISSION,
} as const;

export type TPermission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ALL_PERMISSIONS: readonly TPermission[] = D.values(PERMISSION);

export const isPermission = (value: string): value is TPermission =>
  A.some(ALL_PERMISSIONS, (permission) => permission === value);
