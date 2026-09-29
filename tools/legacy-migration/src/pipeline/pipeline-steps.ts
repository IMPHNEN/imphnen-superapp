import { CMS_STEP } from '../transform/cms/cms-step.ts';
import { DIMENTORIN_STEP } from '../transform/dimentorin/dimentorin-step.ts';
import { GACHA_STEP } from '../transform/gacha/gacha-step.ts';
import { IAM_STEP } from '../transform/iam/iam-step.ts';
import type { TStep } from './step-types.ts';

export const PIPELINE_STEPS: readonly TStep[] = [
  IAM_STEP,
  DIMENTORIN_STEP,
  GACHA_STEP,
  CMS_STEP,
];
