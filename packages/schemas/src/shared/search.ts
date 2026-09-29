import { z } from 'zod';

export const SEARCH_MAX_LENGTH = 100;

export const searchQuerySchema = z.string().max(SEARCH_MAX_LENGTH);
