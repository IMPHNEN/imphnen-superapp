import type { DatabaseSync } from 'node:sqlite';
import { A, D } from '@mobily/ts-belt';
import { describe, expect, it } from 'vitest';
import { COPY_STATUS, type TCopyResult } from './files/file-copy.ts';
import { fixupSqlBuild } from './files/files-fixup.ts';
import {
  DEFER_FOREIGN_KEYS,
  type TSqlFile,
  resetSqlBuild,
  sqlFilesBuild,
} from './load/sql-files.ts';
import { pipelineRun, type TMigrationResult } from './pipeline/pipeline-run.ts';
import type { TTargetTable } from './target/target-table.ts';
import { FIXTURE_OPTIONS } from './testing/fixture-builders.ts';
import { SESSION_ID } from './testing/fixtures/dimentorin-fixture.ts';
import { TEAM_ID } from './testing/fixtures/hackathon-fixture.ts';
import { SUBMISSION_ID } from './testing/fixtures/hackathon-activity-fixture.ts';
import { USER_ID } from './testing/fixtures/iam-fixture.ts';
import { ARGON_HASH } from './testing/fixtures/iam-users-fixture.ts';
import { REHEARSAL_DATASET } from './testing/fixtures/rehearsal-dataset.ts';
import { d1LikeApply, rehearsalDatabase } from './testing/sqlite-rehearsal.ts';
import {
  countQuery,
  countsCompare,
  FOREIGN_KEY_CHECK,
} from './wrangler/verify-counts.ts';

type TRow = Record<string, unknown>;

type TRehearsal = {
  readonly result: TMigrationResult;
  readonly files: readonly TSqlFile[];
  readonly database: DatabaseSync;
  readonly one: (sql: string, ...params: string[]) => TRow;
  readonly all: (sql: string) => TRow[];
};

const rehearse = (): TRehearsal => {
  const result = pipelineRun(REHEARSAL_DATASET, FIXTURE_OPTIONS);
  const files = sqlFilesBuild(result.tables);
  const database = rehearsalDatabase();
  A.forEach(files, (file): void => d1LikeApply(database, file.content));
  const one = (sql: string, ...params: string[]): TRow =>
    database.prepare(sql).get(...params) as TRow;
  const all = (sql: string): TRow[] => database.prepare(sql).all() as TRow[];
  return { result, files, database, one, all };
};

describe('rehearsal against the real D1 schema', (): void => {
  it('produces no blocking rejects for the rehearsal dataset', (): void => {
    const { result } = rehearse();
    expect(
      A.filter(result.rejects, (reject): boolean => reject.blocking)
    ).toEqual([]);
  });

  it('writes every SQL file with deferred foreign keys', (): void => {
    const { files } = rehearse();
    expect(files.length).toBeGreaterThan(0);
    A.forEach(files, (file): void => {
      expect(file.content.startsWith(DEFER_FOREIGN_KEYS)).toBe(true);
    });
  });

  it('keeps every foreign key and matches the expected counts', (): void => {
    const { result, all } = rehearse();
    expect(all(FOREIGN_KEY_CHECK)).toEqual([]);
    const tables = D.keys(result.targetCounts) as TTargetTable[];
    const checks = countsCompare(result.targetCounts, all(countQuery(tables)));
    expect(A.filter(checks, (check): boolean => !check.ok)).toEqual([]);
    expect(result.targetCounts.user).toBeGreaterThan(0);
    expect(result.targetCounts.hackathon_team_member).toBeGreaterThan(0);
  });

  it('stores the migrated values the API reads', (): void => {
    const { one } = rehearse();
    expect(
      one('SELECT email, role FROM "user" WHERE id = ?', USER_ID.ADMIN)
    ).toEqual({ email: 'admin@imphnen.dev', role: 'admin' });
    expect(
      one(
        'SELECT provider_id, password FROM account WHERE user_id = ?',
        USER_ID.ADMIN
      )
    ).toEqual({ provider_id: 'credential', password: ARGON_HASH });
    expect(
      one(
        'SELECT mentor_user_id FROM mentoring_session WHERE id = ?',
        SESSION_ID.REPAIRED
      )
    ).toEqual({ mentor_user_id: USER_ID.MENTOR });
    expect(
      one('SELECT count(*) AS n FROM qr_campaign WHERE is_active = 1')
    ).toEqual({ n: 1 });
    expect(
      one(
        'SELECT role FROM hackathon_team_member WHERE team_id = ? AND user_id = (SELECT leader_id FROM hackathon_team WHERE id = ?)',
        TEAM_ID.GAMMA,
        TEAM_ID.GAMMA
      )
    ).toEqual({ role: 'leader' });
    expect(
      one(
        'SELECT legacy_votes FROM roadmap_item WHERE status = ?',
        'in_progress'
      )
    ).toEqual({ legacy_votes: 42 });
  });

  it('resets the migrated tables in reverse order', (): void => {
    const { result, database, all } = rehearse();
    d1LikeApply(database, resetSqlBuild(result.tables));
    const tables = D.keys(result.targetCounts) as TTargetTable[];
    const counts = A.map(
      all(countQuery(tables)),
      (row): unknown => row.row_count
    );
    expect(A.every(counts, (count): boolean => count === 0)).toBe(true);
  });

  it('applies the fixup SQL when every file copy fails', (): void => {
    const { result, database, one } = rehearse();
    const failed = A.map(
      result.files,
      (file): TCopyResult => ({
        targetKey: file.targetKey,
        status: COPY_STATUS.FAILED,
        detail: 'rehearsal',
      })
    );
    d1LikeApply(database, fixupSqlBuild(result.files, failed));
    expect(
      one(
        'SELECT screenshot_keys FROM hackathon_submission WHERE id = ?',
        SUBMISSION_ID.FINAL
      )
    ).toEqual({ screenshot_keys: '[]' });
    expect(
      one(
        'SELECT count(*) AS n FROM qr_campaign WHERE qr_image_key IS NOT NULL'
      )
    ).toEqual({ n: 0 });
    expect(one('SELECT image FROM "user" WHERE id = ?', USER_ID.ADMIN)).toEqual(
      {
        image:
          'https://cdn.imphnen.dev/imphnen-uploads/profiles/u101/abc-avatar.JPEG',
      }
    );
    expect(
      one(
        'SELECT count(*) AS n FROM hackathon_team WHERE logo_key IS NOT NULL OR banner_key IS NOT NULL'
      )
    ).toEqual({ n: 0 });
  });
});
