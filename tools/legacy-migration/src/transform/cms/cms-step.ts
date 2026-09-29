import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import {
  STEP_NAME,
  type TStep,
  type TStepInput,
  type TStepOutput,
} from '../../pipeline/step-types.ts';
import { rowsOf, userIdsOf, usersById } from '../../shared/state.ts';
import { outputsMerge } from '../../shared/step-output.ts';
import type { TCustomRoleRow } from '../../target/target-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';
import {
  eventsTransform,
  roadmapTransform,
  testimonialsTransform,
} from './content-transform.ts';
import { qrAdminsTransform, qrCampaignsTransform } from './qr-transform.ts';

const run = (input: TStepInput): TStepOutput => {
  const userIds = userIdsOf(input.state);
  return outputsMerge([
    eventsTransform(input.legacy[LEGACY_TABLE.EVENTS]),
    testimonialsTransform(input.legacy[LEGACY_TABLE.TESTIMONIALS], userIds),
    roadmapTransform(input.legacy[LEGACY_TABLE.ROADMAP_ITEMS]),
    qrCampaignsTransform(input.legacy[LEGACY_TABLE.QR_CAMPAIGNS], userIds),
    qrAdminsTransform(
      input.legacy[LEGACY_TABLE.QR_USERS],
      usersById(input.state),
      rowsOf(
        input.state,
        TARGET_TABLE.CUSTOM_ROLE
      ) as readonly TCustomRoleRow[],
      input.options.now
    ),
  ]);
};

export const CMS_STEP: TStep = { name: STEP_NAME.CMS, run };
