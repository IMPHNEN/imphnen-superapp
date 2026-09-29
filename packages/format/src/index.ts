export * from './format-bytes.ts';
export * from './format-kebab.ts';
import { match, P } from 'ts-pattern';

export const NOT_SET = '-';

export const orDash = (value: string | number | null | undefined): string =>
  match(value)
    .with(P.nullish, () => NOT_SET)
    .with('', () => NOT_SET)
    .otherwise((present) => String(present));

export const formatDate = (value: string | Date): string =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    new Date(value)
  );

export const formatDateTime = (value: string | Date): string =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const formatPercent = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);

export const formatUsd = (cents: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100
  );
