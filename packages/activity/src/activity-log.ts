import type { TActivityAction, TActivityResourceType } from './actions.ts';
import type { TActivityDetails } from './details.ts';

export type TActivityMetadataValue = string | number | boolean | null;

export type TActivityMetadata = Readonly<
  Record<string, TActivityMetadataValue>
>;

export type TActivityEntry = {
  actorId: string | null;
  action: TActivityAction;
  resourceType: TActivityResourceType;
  resourceId: string;
  metadata?: TActivityDetails;
};

export type TActivityRepo = {
  insert: (entry: TActivityEntry) => Promise<void>;
};
