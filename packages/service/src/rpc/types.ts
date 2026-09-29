import type {
  InferClientErrors,
  InferClientInputs,
  InferClientOutputs,
} from '@orpc/client';
import type { client } from './client';

export type TClientInputs = InferClientInputs<typeof client>;
export type TClientOutputs = InferClientOutputs<typeof client>;
export type TClientErrors = InferClientErrors<typeof client>;
