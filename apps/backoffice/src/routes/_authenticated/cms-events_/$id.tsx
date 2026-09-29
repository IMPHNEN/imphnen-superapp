import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { errorMessage } from '../../../libs/errors';
import {
  EMPTY_EVENT_FORM,
  eventFormOf,
  eventInputOf,
  type TEventForm,
} from '../_components/cms-events/event-form';
import { useEvent, useEventUpdate } from '../_hooks/use-events';

export const Route = createFileRoute('/_authenticated/cms-events_/$id')({
  component: CmsEventsEditPage,
});

function CmsEventsEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const updateEvent = useEventUpdate();

  const { data: event, isLoading } = useEvent(id);

  const form = useForm<TEventForm>({
    mode: 'all',
    defaultValues: EMPTY_EVENT_FORM,
  });

  useEffect(() => {
    if (event) {
      form.reset(eventFormOf(event));
    }
  }, [event]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateEvent.mutateAsync({ id, ...eventInputOf(data) });
      toast.success('Perubahan event berhasil dilakukan');
      navigate({ to: '/cms-events' });
    } catch (error) {
      toast.error(errorMessage(error, 'Perubahan event gagal dilakukan'));
    }
  });

  if (isLoading) {
    return (
      <main className="w-full px-[48px] py-[40px]">
        <div className="text-center py-8 text-neutral-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="w-full px-[48px] py-[40px] flex flex-col gap-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/cms-events' })}
            className="text-primary-500 hover:text-primary-600"
          >
            <ArrowLeftOutlined className="text-[20px]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <ControlledInputField
              control={form.control}
              label="Nama Event"
              name="name"
              type="text"
              placeholder="Masukkan Nama Event"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Deskripsi"
              name="description"
              type="text"
              placeholder="Masukkan Deskripsi Event"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Link Detail"
              name="detailLink"
              type="text"
              placeholder="Masukkan Link Detail"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Lokasi"
              name="location"
              type="text"
              placeholder="Masukkan Lokasi"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Harga"
              name="price"
              type="number"
              placeholder="Masukkan Harga"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Tanggal Mulai"
              name="startDate"
              type="date"
              placeholder="Pilih Tanggal Mulai"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Tanggal Selesai"
              name="endDate"
              type="date"
              placeholder="Pilih Tanggal Selesai"
              size="lg"
              className="w-full"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_online_update"
                className="rounded"
                {...form.register('isOnline')}
              />
              <label
                htmlFor="is_online_update"
                className="text-p3 font-medium text-neutral-800"
              >
                Event Online
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                type="submit"
              >
                Update Event
              </Button>
              <Button
                variant="bordered"
                size="lg"
                className="w-full"
                onClick={() => navigate({ to: '/cms-events' })}
              >
                Batal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
