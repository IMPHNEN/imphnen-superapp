import { z } from 'zod';

export const HEALTH_STATUS = {
  OK: 'ok',
  READY: 'ready',
  NOT_READY: 'not-ready',
} as const;
export type THealthStatus = (typeof HEALTH_STATUS)[keyof typeof HEALTH_STATUS];

export const healthSchema = z.object({
  status: z.literal(HEALTH_STATUS.OK),
  version: z.string(),
});
export type THealth = z.infer<typeof healthSchema>;

export const DEPENDENCY = {
  DATABASE: 'database',
  STORAGE: 'storage',
} as const;
export type TDependency = (typeof DEPENDENCY)[keyof typeof DEPENDENCY];

export const DEPENDENCY_STATUS = {
  UP: 'up',
  DOWN: 'down',
} as const;
export type TDependencyStatus =
  (typeof DEPENDENCY_STATUS)[keyof typeof DEPENDENCY_STATUS];

export const dependencyReportSchema = z.object({
  name: z.enum([DEPENDENCY.DATABASE, DEPENDENCY.STORAGE]),
  status: z.enum([DEPENDENCY_STATUS.UP, DEPENDENCY_STATUS.DOWN]),
});
export type TDependencyReport = z.infer<typeof dependencyReportSchema>;

export const readinessSchema = z.object({
  status: z.enum([HEALTH_STATUS.READY, HEALTH_STATUS.NOT_READY]),
  version: z.string(),
  dependencies: z.array(dependencyReportSchema),
});
export type TReadiness = z.infer<typeof readinessSchema>;
