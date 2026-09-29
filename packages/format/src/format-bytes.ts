import { match, P } from 'ts-pattern';

const BYTES_PER_UNIT = 1024;

const UNIT = {
  BYTE: 'B',
  KILOBYTE: 'KB',
  MEGABYTE: 'MB',
} as const;

const round = (value: number): string =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);

export const formatBytes = (bytes: number): string =>
  match(bytes)
    .with(
      P.number.lt(BYTES_PER_UNIT),
      (value) => `${round(value)} ${UNIT.BYTE}`
    )
    .with(
      P.number.lt(BYTES_PER_UNIT * BYTES_PER_UNIT),
      (value) => `${round(value / BYTES_PER_UNIT)} ${UNIT.KILOBYTE}`
    )
    .otherwise(
      (value) =>
        `${round(value / (BYTES_PER_UNIT * BYTES_PER_UNIT))} ${UNIT.MEGABYTE}`
    );
