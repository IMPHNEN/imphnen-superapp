import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import {
  isModuleSurface,
  LAYERS,
  nameOf,
  PLACE_KIND,
  placeOf,
  type TAreaPlace,
  type TPlace,
} from './architecture-places.ts';
import {
  AREA,
  COMPOSITION_ROOT,
  LAYER_MAY_IMPORT,
  MODULE_MAY_IMPORT,
  MODULE_SURFACE,
} from './architecture-rules.ts';
import {
  resolveSpecifier,
  specifiersOf,
  TARGET_KIND,
  uncheckedSpecifiersOf,
} from './architecture-specifiers.ts';

export type TViolation = {
  file: string;
  line: number;
  rule: string;
  edge: string;
  specifier: string;
  remedy: string;
};

type TViolationSite = Pick<TViolation, 'file' | 'line' | 'specifier'>;

export const RULE = {
  UNCLASSIFIED_PATH: 'unclassified-path',
  MODULE_LAYER: 'module-layer',
  LAYER_BOUNDARY: 'layer-boundary',
  MODULE_ISOLATION: 'module-isolation',
  AREA_BOUNDARY: 'area-boundary',
  PATH_ESCAPE: 'path-escape',
  UNCHECKED_SPECIFIER: 'unchecked-specifier',
} as const;

const FIRST_LINE = 1;

const rootOf = (file: string): string => file.split('/')[0] ?? file;

const unclassifiedViolation = (
  from: TPlace,
  file: string
): TViolation | undefined =>
  match(from)
    .with(
      { kind: PLACE_KIND.UNKNOWN },
      (found): TViolation => ({
        file,
        line: FIRST_LINE,
        rule: RULE.UNCLASSIFIED_PATH,
        edge: found.name,
        specifier: file,
        remedy: `add "${found.name}" to MODULE or AREA in scripts/architecture-rules.ts, or move the file`,
      })
    )
    .otherwise((): undefined => undefined);

const surfaceViolation = (from: TPlace, file: string): TViolation | undefined =>
  match(from)
    .with(
      { kind: PLACE_KIND.MODULE, layer: null },
      (found): TViolation | undefined =>
        isModuleSurface(file)
          ? undefined
          : {
              file,
              line: FIRST_LINE,
              rule: RULE.MODULE_LAYER,
              edge: found.module,
              specifier: file,
              remedy: `every file in "${found.module}" belongs to one of ${A.join(LAYERS, ', ')}; only "${found.module}/${MODULE_SURFACE}" may sit at the module root`,
            }
    )
    .otherwise((): undefined => undefined);

const targetViolation = (
  to: TPlace,
  site: TViolationSite
): TViolation | undefined =>
  match(to)
    .with(
      { kind: PLACE_KIND.UNKNOWN },
      (found): TViolation => ({
        ...site,
        rule: RULE.UNCLASSIFIED_PATH,
        edge: found.name,
        remedy: `the import lands in "${found.name}", which is neither a module nor an area; fix the path or add it to scripts/architecture-rules.ts`,
      })
    )
    .otherwise((): undefined => undefined);

const layerViolation = (
  from: TPlace,
  to: TPlace,
  site: TViolationSite
): TViolation | undefined =>
  match({ from, to })
    .with(
      {
        from: { kind: PLACE_KIND.MODULE, layer: P.string },
        to: { kind: PLACE_KIND.MODULE, layer: P.string },
      },
      ({ from: source, to: target }): TViolation | undefined =>
        source.module === target.module &&
        !A.includes(LAYER_MAY_IMPORT[source.layer], target.layer)
          ? {
              ...site,
              rule: RULE.LAYER_BOUNDARY,
              edge: `${source.layer} -> ${target.layer}`,
              remedy: `${source.layer} may import ${A.join(LAYER_MAY_IMPORT[source.layer], ', ')}. Move the dependency behind a port`,
            }
          : undefined
    )
    .otherwise((): undefined => undefined);

const moduleViolation = (
  from: TPlace,
  to: TPlace,
  target: string,
  site: TViolationSite
): TViolation | undefined =>
  match({ from, to })
    .with(
      { from: { kind: PLACE_KIND.MODULE }, to: { kind: PLACE_KIND.MODULE } },
      ({ from: source, to: destination }): TViolation | undefined =>
        source.module !== destination.module &&
        (!A.includes(MODULE_MAY_IMPORT[source.module], destination.module) ||
          target !== `${destination.module}/${MODULE_SURFACE}`)
          ? {
              ...site,
              rule: RULE.MODULE_ISOLATION,
              edge: `${source.module} -> ${destination.module}`,
              remedy: `cross-module access goes through "#/${destination.module}/${MODULE_SURFACE}", and the edge must be listed in MODULE_MAY_IMPORT`,
            }
          : undefined
    )
    .otherwise((): undefined => undefined);

const areaCrossesBoundary = (
  from: TAreaPlace,
  to: TPlace,
  file: string
): boolean =>
  match(from.area)
    .with(
      AREA.SHARED,
      (): boolean => !(to.kind === PLACE_KIND.AREA && to.area === AREA.SHARED)
    )
    .with(AREA.PLATFORM, (): boolean => to.kind === PLACE_KIND.MODULE)
    .with(
      AREA.BOOTSTRAP,
      (): boolean =>
        to.kind === PLACE_KIND.MODULE && !A.includes(COMPOSITION_ROOT, file)
    )
    .otherwise((): boolean => false);

const areaViolation = (
  from: TPlace,
  to: TPlace,
  file: string,
  site: TViolationSite
): TViolation | undefined =>
  match(from)
    .with({ kind: PLACE_KIND.AREA }, (source): TViolation | undefined =>
      areaCrossesBoundary(source, to, file)
        ? {
            ...site,
            rule: RULE.AREA_BOUNDARY,
            edge: `${source.area} -> ${nameOf(to)}`,
            remedy: `${source.area} may not depend on ${nameOf(to)}`,
          }
        : undefined
    )
    .otherwise((): undefined => undefined);

const escapeViolation = (file: string, site: TViolationSite): TViolation => ({
  ...site,
  rule: RULE.PATH_ESCAPE,
  edge: rootOf(file),
  remedy: `the specifier resolves outside the file's own directory; use an absolute "#/" specifier so the boundary is checkable`,
});

const uncheckedViolation = (
  file: string,
  site: TViolationSite
): TViolation => ({
  ...site,
  rule: RULE.UNCHECKED_SPECIFIER,
  edge: rootOf(file),
  remedy:
    'a dynamic import or require needs a string literal specifier so the boundary is checkable',
});

const edgeViolation = (
  from: TPlace,
  target: string,
  file: string,
  site: TViolationSite
): TViolation | undefined => {
  const to = placeOf(target);

  return (
    targetViolation(to, site) ??
    layerViolation(from, to, site) ??
    moduleViolation(from, to, target, site) ??
    areaViolation(from, to, file, site)
  );
};

export const violationsFor = (
  file: string,
  source: string
): readonly TViolation[] => {
  const from = placeOf(file);

  const edges = A.filterMap(specifiersOf(source), ({ line, specifier }) => {
    const site: TViolationSite = { file, line, specifier };

    return match(resolveSpecifier(file, specifier))
      .with({ kind: TARGET_KIND.PACKAGE }, (): undefined => undefined)
      .with(
        { kind: TARGET_KIND.ESCAPE },
        (): TViolation => escapeViolation(file, site)
      )
      .with({ kind: TARGET_KIND.INSIDE }, ({ path }): TViolation | undefined =>
        edgeViolation(from, path, file, site)
      )
      .exhaustive();
  });

  const unchecked = A.map(
    uncheckedSpecifiersOf(source),
    ({ line, specifier }) => uncheckedViolation(file, { file, line, specifier })
  );

  return A.filterMap(
    [
      unclassifiedViolation(from, file),
      surfaceViolation(from, file),
      ...edges,
      ...unchecked,
    ],
    (violation) => violation
  );
};
