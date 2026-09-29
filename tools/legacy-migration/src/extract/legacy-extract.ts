import { A, D } from '@mobily/ts-belt';
import pg from 'pg';
import type { TLegacyDataset } from '../legacy/legacy-dataset.ts';
import type { TLegacyTable } from '../legacy/legacy-table.ts';
import { sequential } from '../shared/sequential.ts';
import { HACKATHON_QUERIES } from './hackathon-queries.ts';
import { CONTENT_QUERIES } from './content-queries.ts';
import { CORE_QUERIES } from './legacy-queries.ts';

const APPLICATION_NAME = 'imphnen-legacy-migration';
const READ_ONLY_SESSION = '-c default_transaction_read_only=on';
const BEGIN_SNAPSHOT =
  'BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY';
const ROLLBACK = 'ROLLBACK';
const TABLE_EXISTS = 'SELECT to_regclass($1) IS NOT NULL AS "exists"';

export const LEGACY_QUERIES: Record<TLegacyTable, string> = {
  ...CORE_QUERIES,
  ...CONTENT_QUERIES,
  ...HACKATHON_QUERIES,
};

export type TExtraction = {
  readonly dataset: TLegacyDataset;
  readonly missingTables: readonly TLegacyTable[];
};

type TTableRead = {
  readonly table: TLegacyTable;
  readonly rows: readonly unknown[] | null;
};

const tableRead = async (
  client: pg.Client,
  table: TLegacyTable
): Promise<TTableRead> => {
  const probe = await client.query<{ exists: boolean }>(TABLE_EXISTS, [
    `public.${table}`,
  ]);
  const exists = probe.rows[0]?.exists === true;
  return {
    table,
    rows: exists ? (await client.query(LEGACY_QUERIES[table])).rows : null,
  };
};

export const legacyExtract = async (
  connectionString: string
): Promise<TExtraction> => {
  const client = new pg.Client({
    connectionString,
    application_name: APPLICATION_NAME,
    options: READ_ONLY_SESSION,
  });
  await client.connect();
  try {
    await client.query(BEGIN_SNAPSHOT);
    const reads = await sequential(
      D.keys(LEGACY_QUERIES) as readonly TLegacyTable[],
      (table): Promise<TTableRead> => tableRead(client, table)
    );
    await client.query(ROLLBACK);
    return {
      dataset: D.fromPairs(
        A.map(reads, (read): readonly [TLegacyTable, readonly unknown[]] => [
          read.table,
          read.rows ?? [],
        ])
      ) as unknown as TLegacyDataset,
      missingTables: A.filterMap(reads, (read): TLegacyTable | undefined =>
        read.rows === null ? read.table : undefined
      ),
    };
  } finally {
    await client.end();
  }
};
