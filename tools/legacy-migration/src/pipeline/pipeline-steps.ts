import { IAM_STEP } from '../transform/iam/iam-step.ts';
import type { TStep } from './step-types.ts';

export const PIPELINE_STEPS: readonly TStep[] = [IAM_STEP];
