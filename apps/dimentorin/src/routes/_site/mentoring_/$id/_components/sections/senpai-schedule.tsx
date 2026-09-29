import { Button } from '@imphnen-frontend-service/ui/atoms';
import { For } from '@imphnen-frontend-service/utils';
import type { FC } from 'react';
import type { TMentoringAvailability } from '../../../_hooks/use-mentors';

const DATE_FORMAT = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const TIME_FORMAT = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
});

type TBusyDay = { date: string; times: string[] };

/** Groups the booked intervals of the availability window per local day. */
const busyDays = (busy: TMentoringAvailability['busy']): TBusyDay[] => {
  const days = new Map<string, string[]>();
  for (const slot of busy) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const date = DATE_FORMAT.format(start);
    const times = days.get(date) ?? [];
    times.push(`${TIME_FORMAT.format(start)} - ${TIME_FORMAT.format(end)}`);
    days.set(date, times);
  }
  return Array.from(days, ([date, times]) => ({ date, times }));
};

type Props = {
  onBook: () => void;
  availability?: TMentoringAvailability;
};

export const SenpaiScheduleSection: FC<Props> = ({ onBook, availability }) => {
  const days = busyDays(availability?.busy ?? []);
  const formats = availability?.preferredMentoringFormats ?? [];

  return (
    <div>
      <h2 className="text-xs font-semibold mb-3 md:text-[15px] xl:text-[19px]">
        Senpai Schedule
      </h2>
      <div className="p-4 bg-primary-50 border border-primary-100 rounded-md space-y-5">
        <div>
          <p className="text-[15px] font-medium mb-2">
            {availability?.availabilityCommitment ||
              'Jadwal menyesuaikan kesepakatan dengan Senpai'}
          </p>
          {formats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <For data={formats}>
                {(format) => (
                  <div
                    key={format}
                    className="bg-primary-300 text-primary-600 px-3 py-2 text-xs rounded-md font-semibold"
                  >
                    {format}
                  </div>
                )}
              </For>
            </div>
          )}
        </div>

        {days.length === 0 ? (
          <p className="text-xs text-neutral-600">
            Belum ada jadwal terisi dalam 14 hari ke depan.
          </p>
        ) : (
          <For data={days}>
            {(day) => (
              <div key={day.date}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[15px] font-medium">{day.date}</p>
                  <p className="rounded-4xl py-1 px-2.5 text-xs font-medium bg-danger-100 text-danger-600">
                    {day.times.length} sesi terisi
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <For data={day.times}>
                    {(time, index) => (
                      <div
                        key={index}
                        className="bg-neutral-200 text-neutral-600 px-3 py-2 text-xs rounded-md font-semibold line-through"
                      >
                        {time}
                      </div>
                    )}
                  </For>
                </div>
              </div>
            )}
          </For>
        )}

        <hr className="border-primary-200" />

        <Button type="button" size="sm" className="w-full" onClick={onBook}>
          Book Your Senpai!
        </Button>
      </div>
    </div>
  );
};
