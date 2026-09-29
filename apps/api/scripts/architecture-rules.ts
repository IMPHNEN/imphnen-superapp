export const LAYER = {
  DOMAIN: 'domain',
  APPLICATION: 'application',
  INFRASTRUCTURE: 'infrastructure',
  PRESENTATION: 'presentation',
} as const;

export type TLayer = (typeof LAYER)[keyof typeof LAYER];

export const LAYER_MAY_IMPORT: Readonly<Record<TLayer, readonly TLayer[]>> = {
  [LAYER.DOMAIN]: [LAYER.DOMAIN],
  [LAYER.APPLICATION]: [LAYER.DOMAIN, LAYER.APPLICATION],
  [LAYER.INFRASTRUCTURE]: [LAYER.DOMAIN, LAYER.INFRASTRUCTURE],
  [LAYER.PRESENTATION]: [LAYER.DOMAIN, LAYER.APPLICATION, LAYER.PRESENTATION],
};

export const MODULE = {
  ACTIVITY: 'activity',
  AUTH: 'auth',
  HEALTH: 'health',
  PERMISSION: 'permission',
  ROLE: 'role',
  USER: 'user',
} as const;

export type TModule = (typeof MODULE)[keyof typeof MODULE];

export const MODULE_MAY_IMPORT: Readonly<Record<TModule, readonly TModule[]>> =
  {
    [MODULE.ACTIVITY]: [],
    [MODULE.AUTH]: [MODULE.ACTIVITY, MODULE.ROLE],
    [MODULE.HEALTH]: [],
    [MODULE.PERMISSION]: [],
    [MODULE.ROLE]: [],
    [MODULE.USER]: [MODULE.AUTH, MODULE.ROLE],
  };

export const AREA = {
  SHARED: 'shared',
  PLATFORM: 'platform',
  BOOTSTRAP: 'bootstrap',
  SCRIPTS: 'scripts',
} as const;

export type TArea = (typeof AREA)[keyof typeof AREA];

export const ENTRYPOINT: readonly string[] = ['main.ts'];

export const COMPOSITION_ROOT: readonly string[] = [
  'bootstrap/compose.ts',
  'bootstrap/router.ts',
];

export const MODULE_SURFACE = 'index.ts';
