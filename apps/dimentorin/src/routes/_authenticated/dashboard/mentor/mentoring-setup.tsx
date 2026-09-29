import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Icon } from '@iconify/react';
import { Button, Switch, Badge } from '@imphnen-frontend-service/ui/atoms';
import { toast } from 'sonner';
import {
  errorText,
  useMyMentorProfile,
  useUpdateMyMentorProfile,
} from '../_hooks/use-mentoring-sessions';

/**
 * Mentoring setup page route.
 * Renders mentor topics and weekly mentoring session availability.
 */
export const Route = createFileRoute(
  '/_authenticated/dashboard/mentor/mentoring-setup'
)({
  component: MentoringSetupPage,
});

const TOPIC_ICON: Record<string, string> = {
  'Career & Self Development': 'mdi:briefcase-outline',
  'Industry Insight': 'mdi:office-building-outline',
  'Project Management & IT Tools': 'mdi:clipboard-text-outline',
  'Basic IT': 'mdi:laptop',
  'Programming/Software Dev': 'mdi:console',
  'Data & Database': 'mdi:database-outline',
  'AI Tips': 'mdi:robot-outline',
};
const DEFAULT_TOPIC_ICON = 'mdi:tag-outline';
const TOPICS_MAX = 30;

type SessionDay = {
  day: string;
  isActive: boolean;
  slots: string[];
  helperText?: string;
  canAddSession?: boolean;
};

// Weekly slots have no API yet (only a free-text commitment): mock data.
const sessionDays: SessionDay[] = [
  {
    day: 'Senin',
    isActive: true,
    slots: ['17:00', '19:00'],
    canAddSession: true,
  },
  {
    day: 'Selasa',
    isActive: false,
    slots: [],
    helperText: 'Tidak ada sesi hari ini',
  },
  { day: 'Rabu', isActive: false, slots: [] },
  { day: 'Kamis', isActive: false, slots: [] },
  { day: "Jum'at", isActive: false, slots: [] },
  { day: 'Sabtu', isActive: false, slots: [] },
  { day: 'Minggu', isActive: false, slots: [] },
];

/**
 * Mentoring setup page.
 * @returns JSX element for mentor mentoring setup route content.
 */
export function MentoringSetupPage() {
  const [days, setDays] = useState<SessionDay[]>(sessionDays);
  const { data: mentor } = useMyMentorProfile();
  const updateProfile = useUpdateMyMentorProfile();
  const topics = mentor?.topicsOfInterest ?? [];

  const addTopic = () => {
    const topic = globalThis.prompt('Topik baru')?.trim();
    if (!topic || topics.includes(topic)) return;
    if (topics.length >= TOPICS_MAX) {
      toast.error('Maksimal 30 topik');
      return;
    }
    updateProfile.mutate(
      { topicsOfInterest: [...topics, topic] },
      {
        onSuccess: () => toast.success('Topik ditambahkan'),
        onError: (error) =>
          toast.error(errorText(error, 'Gagal menambahkan topik')),
      }
    );
  };

  const toggleDay = (dayName: string) => {
    setDays((prev) =>
      prev.map((d) => (d.day === dayName ? { ...d, isActive: !d.isActive } : d))
    );
  };

  return (
    <section className="w-243">
      <div className="rounded-sm border border-border-light bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <article className="space-y-6">
            <header className="flex items-center justify-between gap-3">
              <h1 className="text-[35px] font-semibold leading-none text-text-label">
                Topics
              </h1>
              <Button
                variant="primary"
                size="sm"
                onClick={addTopic}
                disabled={!mentor || updateProfile.isPending}
              >
                <Icon icon="mdi:plus" width="14" />
                Tambah Topik
              </Button>
            </header>

            <div className="min-h-116 rounded-sm border border-primary-100 bg-primary-50 p-6">
              <div className="flex flex-wrap gap-2">
                {topics.length === 0 && (
                  <p className="text-xs text-text-muted">Belum ada topik.</p>
                )}
                {topics.map((topic) => (
                  <Badge key={topic} variant="outline">
                    <Icon
                      icon={TOPIC_ICON[topic] ?? DEFAULT_TOPIC_ICON}
                      width="14"
                      className="text-[#6c7a89]"
                    />
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </article>

          <article className="space-y-6">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-[35px] font-semibold leading-none text-text-label">
                Mentoring Session
              </h2>
              <Button variant="primary" size="sm">
                <Icon icon="mdi:plus" width="14" />
                Tambah Sesi
              </Button>
            </header>

            <div className="min-h-116 rounded-sm border border-primary-100 bg-primary-50 px-6 py-4">
              <div className="divide-y divide-primary-100/50">
                {days.map((sessionDay) => (
                  <div
                    key={sessionDay.day}
                    className="flex items-center justify-between py-5 first:pt-2 last:pb-2"
                  >
                    <div className="space-y-2">
                      <p className="text-[31px] font-semibold leading-tight text-text-label">
                        {sessionDay.day}
                      </p>

                      {sessionDay.isActive ? (
                        <div className="space-y-2">
                          {sessionDay.slots.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                              {sessionDay.slots.map((slot) => (
                                <Badge key={slot} variant="outline">
                                  {slot}
                                </Badge>
                              ))}
                              <button
                                type="button"
                                className="text-xs font-medium text-primary-accent"
                              >
                                Tambah Sesi
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-text-muted">
                          {sessionDay.helperText || 'Tidak ada sesi hari ini'}
                        </p>
                      )}
                    </div>

                    <Switch
                      checked={sessionDay.isActive}
                      onCheckedChange={() => toggleDay(sessionDay.day)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
