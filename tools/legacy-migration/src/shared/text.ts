import { A } from '@mobily/ts-belt';

const EMPTY = '';

export const blankToNull = (value: string | null | undefined): string | null =>
  value === null || value === undefined || value.trim() === EMPTY
    ? null
    : value;

export const emptyToNull = (value: string | null): string | null =>
  value === EMPTY ? null : value;

export const cut = (value: string, max: number): string =>
  A.join(A.take(Array.from(value), max), EMPTY);
