import {
  HACKATHON_TEAM_VISIBILITY,
  type THackathonTeamBrowseInput,
} from '@app/schemas';
import { and, eq, gte, lte, not, type SQL, sql } from 'drizzle-orm';
import { match, P } from 'ts-pattern';
import { containsWhere } from '#/platform/db/search.ts';
import { hackathonTeam } from '#/platform/db/tables/hackathon.ts';
import {
  memberCountOf,
  submissionExistsFor,
} from '#/hackathon/infrastructure/hackathon-sql.ts';

export const teamSearchWhere = (search: string | undefined): SQL | undefined =>
  match(search)
    .with(P.string.minLength(1), (value) =>
      containsWhere(hackathonTeam.name, value)
    )
    .otherwise(() => undefined);

const cityWhere = (city: string | undefined): SQL | undefined =>
  match(city)
    .with(
      P.string.minLength(1),
      (value) =>
        sql`lower(${hackathonTeam.city}) = ${value.trim().toLowerCase()}`
    )
    .otherwise(() => undefined);

const minWhere = (min: number | undefined): SQL | undefined =>
  match(min)
    .with(P.number, (value) => gte(memberCountOf(hackathonTeam.id), value))
    .otherwise(() => undefined);

const maxWhere = (max: number | undefined): SQL | undefined =>
  match(max)
    .with(P.number, (value) => lte(memberCountOf(hackathonTeam.id), value))
    .otherwise(() => undefined);

const submissionWhere = (has: boolean | undefined): SQL | undefined =>
  match(has)
    .with(true, () => submissionExistsFor(hackathonTeam.id))
    .with(false, () => not(submissionExistsFor(hackathonTeam.id)))
    .otherwise(() => undefined);

export const teamBrowseWhere = (
  input: THackathonTeamBrowseInput
): SQL | undefined =>
  and(
    eq(hackathonTeam.visibility, HACKATHON_TEAM_VISIBILITY.PUBLIC),
    teamSearchWhere(input.search),
    cityWhere(input.city),
    minWhere(input.minMembers),
    maxWhere(input.maxMembers),
    submissionWhere(input.hasSubmission)
  );
