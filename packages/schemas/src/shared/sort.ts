import { z } from 'zod';

export const SORT_DIRECTION = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type TSortDirection =
  (typeof SORT_DIRECTION)[keyof typeof SORT_DIRECTION];

export const sortDirectionSchema = z.enum([
  SORT_DIRECTION.ASC,
  SORT_DIRECTION.DESC,
]);
