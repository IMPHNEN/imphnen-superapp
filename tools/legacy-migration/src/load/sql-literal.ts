import { match, P } from 'ts-pattern';
import type { TSqlValue } from '../target/target-rows.ts';

const QUOTE = "'";
const ESCAPED_QUOTE = "''";
const DOUBLE_QUOTE = '"';
const ESCAPED_DOUBLE_QUOTE = '""';
const SQL_NULL = 'NULL';
const NOT_FINITE = 'refusing to write a non-finite number';

export const sqlIdentifier = (name: string): string =>
  `${DOUBLE_QUOTE}${name.replaceAll(DOUBLE_QUOTE, ESCAPED_DOUBLE_QUOTE)}${DOUBLE_QUOTE}`;

export const sqlLiteral = (value: TSqlValue): string =>
  match(value)
    .with(P.nullish, (): string => SQL_NULL)
    .with(P.number, (number): string => {
      if (!Number.isFinite(number)) {
        throw new Error(`${NOT_FINITE}: ${number}`);
      }
      return String(number);
    })
    .with(
      P.string,
      (text): string =>
        `${QUOTE}${text.replaceAll(QUOTE, ESCAPED_QUOTE)}${QUOTE}`
    )
    .exhaustive();
