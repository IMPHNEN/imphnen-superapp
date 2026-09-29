import type { TActivityMetadata } from '@app/activity';
import { activityMetadataSchema } from '@app/schemas';
import { match } from 'ts-pattern';

export const activityMetadataDecode = (
  stored: unknown
): TActivityMetadata | null =>
  match(activityMetadataSchema.nullable().safeParse(stored))
    .with({ success: true }, ({ data }): TActivityMetadata | null => data)
    .otherwise((): null => null);
