import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';

export const JSON_EMPTY_ARRAY = '[]';

export type TJsonParse =
  | { readonly ok: true; readonly value: unknown }
  | { readonly ok: false };

export const jsonParse = (text: string): TJsonParse => {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
};

export const jsonText = (value: unknown): string => JSON.stringify(value);

export const jsonTextOrNull = (text: string | null): string | null =>
  match(text === null ? null : jsonParse(text))
    .with({ ok: true, value: P.not(P.nullish) }, (parsed): string =>
      jsonText(parsed.value)
    )
    .otherwise((): null => null);

export const stringElements = (values: readonly unknown[]): string[] =>
  A.map(values, (value): string =>
    typeof value === 'string' ? value : JSON.stringify(value)
  ) as string[];

export const stringArrayText = (text: string | null): string =>
  match(text === null ? null : jsonParse(text))
    .with({ ok: true, value: P.array() }, (parsed): string =>
      jsonText(stringElements(parsed.value as readonly unknown[]))
    )
    .otherwise((): string => JSON_EMPTY_ARRAY);
