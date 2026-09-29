import { A, D } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import {
  AREA,
  ENTRYPOINT,
  LAYER,
  MODULE,
  MODULE_SURFACE,
  type TArea,
  type TLayer,
  type TModule,
} from './architecture-rules.ts';

export const PLACE_KIND = {
  MODULE: 'module',
  AREA: 'area',
  ENTRYPOINT: 'entrypoint',
  UNKNOWN: 'unknown',
} as const;

export type TModulePlace = {
  kind: typeof PLACE_KIND.MODULE;
  module: TModule;
  layer: TLayer | null;
};

export type TAreaPlace = {
  kind: typeof PLACE_KIND.AREA;
  area: TArea;
};

export type TEntrypointPlace = {
  kind: typeof PLACE_KIND.ENTRYPOINT;
  path: string;
};

export type TUnknownPlace = {
  kind: typeof PLACE_KIND.UNKNOWN;
  name: string;
};

export type TPlace =
  | TModulePlace
  | TAreaPlace
  | TEntrypointPlace
  | TUnknownPlace;

const MODULES: readonly string[] = D.values(MODULE);
const AREAS: readonly string[] = D.values(AREA);
export const LAYERS: readonly string[] = D.values(LAYER);

const MODULE_ROOT_DEPTH = 2;

const isModule = (value: string): value is TModule =>
  A.includes(MODULES, value);

const isArea = (value: string): value is TArea => A.includes(AREAS, value);

const isLayer = (value: string): value is TLayer => A.includes(LAYERS, value);

const layerOf = (segment: string): TLayer | null =>
  isLayer(segment) ? segment : null;

export const placeOf = (path: string): TPlace => {
  const segments = path.split('/');
  const head = segments[0] ?? '';

  return match(head)
    .when(
      (): boolean => A.includes(ENTRYPOINT, path),
      (): TPlace => ({ kind: PLACE_KIND.ENTRYPOINT, path })
    )
    .when(
      isModule,
      (module): TPlace => ({
        kind: PLACE_KIND.MODULE,
        module,
        layer: layerOf(segments[1] ?? ''),
      })
    )
    .when(isArea, (area): TPlace => ({ kind: PLACE_KIND.AREA, area }))
    .otherwise((name): TPlace => ({ kind: PLACE_KIND.UNKNOWN, name }));
};

export const nameOf = (place: TPlace): string =>
  match(place)
    .with({ kind: PLACE_KIND.MODULE }, (found): string => found.module)
    .with({ kind: PLACE_KIND.AREA }, (found): string => found.area)
    .with({ kind: PLACE_KIND.ENTRYPOINT }, (found): string => found.path)
    .with({ kind: PLACE_KIND.UNKNOWN }, (found): string => found.name)
    .exhaustive();

export const isModuleSurface = (file: string): boolean => {
  const segments = file.split('/');
  return (
    segments.length === MODULE_ROOT_DEPTH && segments[1] === MODULE_SURFACE
  );
};
