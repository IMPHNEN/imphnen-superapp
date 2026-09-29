import { createFileRoute } from '@tanstack/react-router';
import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Badge, Button, Card, Input } from '@imphnen-frontend-service/ui/atoms';
import { formatDate, useMySessions } from '../_hooks/use-mentoring-sessions';

/**
 * Feedback page route.
 * Shows mentor feedback filters and two-column feedback feed cards.
 */
export const Route = createFileRoute(
  '/_authenticated/dashboard/mentor/feedback'
)({
  component: FeedbackPage,
});

type RatingFilter = {
  id: string;
  label: string;
  showStar: boolean;
  rating?: 1 | 2 | 3 | 4 | 5;
};

const ratingFilters: RatingFilter[] = [
  { id: 'all', label: 'Tampilkan Semua', showStar: false },
  { id: 'five', label: '5 Bintang', showStar: true, rating: 5 },
  { id: 'four', label: '4 Bintang', showStar: true, rating: 4 },
  { id: 'three', label: '3 Bintang', showStar: true, rating: 3 },
  { id: 'two', label: '2 Bintang', showStar: true, rating: 2 },
  { id: 'one', label: '1 Bintang', showStar: true, rating: 1 },
];

const PAGE_SIZE = 50;

/**
 * Feedback page.
 * @returns JSX element for mentor feedback route content.
 */
export function FeedbackPage() {
  const [activeFilter, setActiveFilter] = useState<RatingFilter>(
    ratingFilters[0]
  );
  const { data, isLoading } = useMySessions({
    role: 'mentor',
    hasFeedback: true,
    rating: activeFilter.rating,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const feedbackItems = data?.items ?? [];

  return (
    <section className="w-243 space-y-5">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[232px_1fr] lg:items-end">
        <div className="space-y-2">
          <p className="text-[23px] font-semibold leading-none text-text-label">
            Waktu Mentoring
          </p>
          <div className="relative">
            <Input
              type="text"
              size="sm"
              value="22 Maret 2025"
              readOnly
              className="pr-10"
            />
            <Icon
              icon="mdi:calendar-blank-outline"
              width="18"
              className="text-text-muted absolute right-3 top-1/2 -translate-y-1/2"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[23px] font-semibold leading-none text-text-label">
            Cari Berdasarkan Rating
          </p>
          <div className="flex flex-wrap gap-2">
            {ratingFilters.map((filter) => (
              <Button
                key={filter.id}
                size="sm"
                variant={
                  filter.id === activeFilter.id ? 'primary' : 'secondary'
                }
                onClick={() => setActiveFilter(filter)}
              >
                {filter.showStar && (
                  <Icon icon="mdi:star" width="15" className="text-[#f7b135]" />
                )}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {!isLoading && feedbackItems.length === 0 && (
        <p className="text-[15px] text-text-muted">Belum ada feedback.</p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {feedbackItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <Icon
                  icon="mdi:calendar-month-outline"
                  width="15"
                  className="text-text-muted"
                />
                {formatDate(item.feedbackSubmittedAt ?? item.scheduledAt)}
              </Badge>

              <Badge variant="warning">
                <Icon icon="mdi:star" width="15" className="text-[#f7b135]" />
                {(item.rating ?? 0).toFixed(1)}
              </Badge>

              <Badge variant="outline">
                <Icon
                  icon="mdi:account-circle-outline"
                  width="15"
                  className="text-text-muted"
                />
                {item.mentee.name}
              </Badge>
            </div>

            <p className="mt-4 text-[15px] leading-[1.35] text-text-label">
              "{item.feedback}"
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
