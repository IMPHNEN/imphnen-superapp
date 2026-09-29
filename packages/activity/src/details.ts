import { A, D } from '@mobily/ts-belt';
import type { TActivityMetadataValue } from './activity-log.ts';

export const ACTIVITY_DETAIL = {
  LABEL: 'label',
  PREVIOUS_LABEL: 'previousLabel',
  PERMISSION_COUNT: 'permissionCount',
  PERMISSIONS_ADDED: 'permissionsAdded',
  PERMISSIONS_REMOVED: 'permissionsRemoved',
  EMAIL: 'email',
  ROLE: 'role',
  PREVIOUS_ROLE: 'previousRole',
  NAME: 'name',
  PREVIOUS_NAME: 'previousName',
  FILE_NAME: 'fileName',
  BYTE_SIZE: 'byteSize',
  TITLE: 'title',
  CHANGED_FIELDS: 'changedFields',
} as const;

export type TActivityDetail =
  (typeof ACTIVITY_DETAIL)[keyof typeof ACTIVITY_DETAIL];

export type TActivityDetails = Readonly<
  Partial<Record<TActivityDetail, TActivityMetadataValue>>
>;

type TActivityDetailsDraft = Partial<
  Record<TActivityDetail, TActivityMetadataValue | undefined>
>;

export const ACTIVITY_DETAIL_LIST_SEPARATOR = ', ';

export const activityDetails = (
  draft: TActivityDetailsDraft
): TActivityDetails =>
  D.filter(draft, (value): boolean => value !== undefined) as TActivityDetails;

export const activityDetailList = (
  values: readonly string[]
): string | undefined =>
  A.isEmpty(values)
    ? undefined
    : A.join(values, ACTIVITY_DETAIL_LIST_SEPARATOR);

export const activityDetailPrevious = <TValue>(
  previous: TValue,
  next: TValue
): TValue | undefined => (previous === next ? undefined : previous);
