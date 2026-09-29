import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type TPagination = z.infer<typeof paginationSchema>;

type TPaginatedOutput<TItem extends z.ZodTypeAny> = {
  items: readonly z.infer<TItem>[];
  total: number;
  page: number;
  pageSize: number;
};

export const paginated = <TItem extends z.ZodTypeAny>(
  item: TItem
): z.ZodType<TPaginatedOutput<TItem>> =>
  z.object({
    items: z.array(item),
    total: z.number().int().min(0),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
  });
