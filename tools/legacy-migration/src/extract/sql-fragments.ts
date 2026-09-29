import { A } from '@mobily/ts-belt';

const SEPARATOR = ',\n  ';

export const col = (name: string): string => `"${name}"`;

export const ms = (name: string): string =>
  `floor(extract(epoch from "${name}") * 1000)::float8 AS "${name}"`;

export const jsonAsText = (name: string): string =>
  `"${name}"::text AS "${name}"`;

export const arrayAsJson = (name: string): string =>
  `array_to_json("${name}")::text AS "${name}"`;

export const bytesAsBase64 = (name: string, alias: string): string =>
  `translate(encode("${name}", 'base64'), E'\\n', '') AS "${alias}"`;

export const selectFrom = (
  table: string,
  columns: readonly string[],
  orderBy: string
): string =>
  `SELECT\n  ${A.join(columns, SEPARATOR)}\nFROM "${table}"\nORDER BY ${orderBy}`;
