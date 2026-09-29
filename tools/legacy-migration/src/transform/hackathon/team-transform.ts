import { HACKATHON_TEAM_VISIBILITY } from '@app/schemas';
import { A } from '@mobily/ts-belt';
import { match, P } from 'ts-pattern';
import type { TLegacyHackathonTeam } from '../../legacy/legacy-hackathon-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TFileCopy,
  TFileRef,
  TMigrationOptions,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type { THackathonTeamRow } from '../../target/target-hackathon-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import { valueRef } from '../shared/legacy-file.ts';
import {
  HACKATHON_FILE_PREFIX,
  hackathonKeyFile,
  type THackathonFile,
} from './hackathon-file.ts';

const COLUMN = { LOGO: 'logo_key', BANNER: 'banner_key' } as const;

export const visibilityOf = (visibility: string): string =>
  visibility.trim().toLowerCase() === HACKATHON_TEAM_VISIBILITY.PUBLIC
    ? HACKATHON_TEAM_VISIBILITY.PUBLIC
    : HACKATHON_TEAM_VISIBILITY.PRIVATE;

const teamOutput = (
  team: TLegacyHackathonTeam,
  leaderId: string,
  options: TMigrationOptions
): TStepOutput => {
  const image = (value: string | null, column: string): THackathonFile =>
    hackathonKeyFile(
      value,
      HACKATHON_FILE_PREFIX.TEAM,
      (stored): TFileRef =>
        valueRef(TARGET_TABLE.HACKATHON_TEAM, team.id, column, stored, null),
      options
    );
  const logo = image(team.logo, COLUMN.LOGO);
  const banner = image(team.banner, COLUMN.BANNER);
  const visibility = visibilityOf(team.visibility);
  const row: THackathonTeamRow = {
    id: team.id,
    name: team.name,
    description: team.description,
    city: team.city,
    visibility,
    logo_key: logo.stored,
    banner_key: banner.stored,
    leader_id: leaderId,
    created_at: team.created_at,
    updated_at: team.updated_at,
  };
  const note = (detail: string): TAdjustment =>
    adjustmentOf(
      LEGACY_TABLE.HACKATHON_TEAMS,
      team.id,
      ADJUSTMENT_RULE.HACKATHON_VALUE_MAPPED,
      detail
    );
  const dropped = (value: string | null, stored: string | null): boolean =>
    value !== null && value.trim() !== '' && stored === null;
  return outputOf({
    inserts: [{ table: TARGET_TABLE.HACKATHON_TEAM, rows: [row] }],
    files: A.filterMap(
      [logo.file, banner.file],
      (file): TFileCopy | undefined => file ?? undefined
    ),
    adjustments: [
      ...(visibility === team.visibility
        ? []
        : [note(`visibility ${team.visibility} -> ${visibility}`)]),
      ...(dropped(team.logo, logo.stored)
        ? [note(`logo ${team.logo} dropped`)]
        : []),
      ...(dropped(team.banner, banner.stored)
        ? [note(`banner ${team.banner} dropped`)]
        : []),
    ],
  });
};

export const teamsTransform = (
  teams: readonly TLegacyHackathonTeam[],
  uidOf: (legacyId: string) => string | null,
  options: TMigrationOptions
): TStepOutput =>
  outputsMerge(
    A.map(
      teams,
      (team): TStepOutput =>
        match(uidOf(team.leader_id))
          .with(
            P.string,
            (leaderId): TStepOutput => teamOutput(team, leaderId, options)
          )
          .otherwise(
            (): TStepOutput =>
              outputOf({
                rejects: [
                  rejectOf(
                    LEGACY_TABLE.HACKATHON_TEAMS,
                    team.id,
                    REJECT_REASON.USER_MISSING,
                    `leader ${team.leader_id}`
                  ),
                ],
              })
          )
    )
  );
