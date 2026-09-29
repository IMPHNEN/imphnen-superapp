import {
  ROADMAP_STATUS,
  TESTIMONIAL_STATUS,
  type TRoadmapStatus,
} from '@app/schemas';
import { A, D } from '@mobily/ts-belt';
import type {
  TLegacyEvent,
  TLegacyRoadmapItem,
  TLegacyTestimonial,
} from '../../legacy/legacy-rows.ts';
import { LEGACY_TABLE } from '../../legacy/legacy-table.ts';
import { ADJUSTMENT_RULE, REJECT_REASON } from '../../pipeline/report-codes.ts';
import type {
  TAdjustment,
  TReject,
  TStepOutput,
} from '../../pipeline/step-types.ts';
import {
  adjustmentOf,
  outputOf,
  outputsMerge,
  rejectOf,
} from '../../shared/step-output.ts';
import type {
  TEventRow,
  TRoadmapItemRow,
  TTestimonialRow,
} from '../../target/target-content-rows.ts';
import { TARGET_TABLE } from '../../target/target-table.ts';

const SQL_TRUE = 1;
const SQL_FALSE = 0;

const deletedAtOf = (isDeleted: boolean, updatedAt: number): number | null =>
  isDeleted ? updatedAt : null;

const eventOutput = (event: TLegacyEvent): TStepOutput => {
  const rounded = Math.round(event.price);
  const price = Math.max(0, rounded);
  const row: TEventRow = {
    id: event.id,
    name: event.name,
    description: event.description,
    detail_link: event.detail_link,
    price,
    is_online: event.is_online ? SQL_TRUE : SQL_FALSE,
    location: event.location,
    start_date: event.start_date,
    end_date: event.end_date,
    deleted_at: deletedAtOf(event.is_deleted, event.updated_at),
    created_at: event.created_at,
    updated_at: event.updated_at,
  };
  const note = (rule: TAdjustment['rule'], detail: string): TAdjustment =>
    adjustmentOf(LEGACY_TABLE.EVENTS, event.id, rule, detail);
  return outputOf({
    inserts: [{ table: TARGET_TABLE.EVENT, rows: [row] }],
    adjustments: [
      ...(rounded === event.price
        ? []
        : [
            note(
              ADJUSTMENT_RULE.EVENT_PRICE_ROUNDED,
              `${event.price} -> ${rounded}`
            ),
          ]),
      ...(rounded < 0
        ? [note(ADJUSTMENT_RULE.EVENT_PRICE_CLAMPED, `${rounded} -> 0`)]
        : []),
    ],
  });
};

export const eventsTransform = (events: readonly TLegacyEvent[]): TStepOutput =>
  outputsMerge(A.map(events, eventOutput));

const testimonialRow = (testimonial: TLegacyTestimonial): TTestimonialRow => ({
  id: testimonial.id,
  user_id: testimonial.user_id,
  role: testimonial.role,
  content: testimonial.content,
  status: TESTIMONIAL_STATUS.APPROVED,
  reviewed_by: null,
  approved_at: testimonial.created_at,
  deleted_at: deletedAtOf(testimonial.is_deleted, testimonial.updated_at),
  created_at: testimonial.created_at,
  updated_at: testimonial.updated_at,
});

export const testimonialsTransform = (
  testimonials: readonly TLegacyTestimonial[],
  userIds: ReadonlySet<string>
): TStepOutput => {
  const [known, orphan] = A.partition(testimonials, (row): boolean =>
    userIds.has(row.user_id)
  );
  return outputOf({
    inserts: [
      { table: TARGET_TABLE.TESTIMONIAL, rows: A.map(known, testimonialRow) },
    ],
    rejects: A.map(
      orphan,
      (row): TReject =>
        rejectOf(
          LEGACY_TABLE.TESTIMONIALS,
          row.id,
          REJECT_REASON.USER_MISSING,
          `user ${row.user_id}`
        )
    ),
  });
};

const ROADMAP_STATUSES: readonly string[] = D.values(ROADMAP_STATUS);

const roadmapOutput = (item: TLegacyRoadmapItem): TStepOutput => {
  const known = A.includes(ROADMAP_STATUSES, item.status);
  const row: TRoadmapItemRow = {
    id: item.id,
    title: item.title,
    description: item.description,
    status: known ? (item.status as TRoadmapStatus) : ROADMAP_STATUS.UPCOMING,
    legacy_votes: item.votes,
    deleted_at: deletedAtOf(item.is_deleted, item.updated_at),
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
  return outputOf({
    inserts: [{ table: TARGET_TABLE.ROADMAP_ITEM, rows: [row] }],
    adjustments: known
      ? []
      : [
          adjustmentOf(
            LEGACY_TABLE.ROADMAP_ITEMS,
            item.id,
            ADJUSTMENT_RULE.ROADMAP_STATUS_DEFAULTED,
            `${item.status} -> ${ROADMAP_STATUS.UPCOMING}`
          ),
        ],
  });
};

export const roadmapTransform = (
  items: readonly TLegacyRoadmapItem[]
): TStepOutput => outputsMerge(A.map(items, roadmapOutput));
