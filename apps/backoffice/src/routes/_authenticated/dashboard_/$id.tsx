import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { errorMessage } from '../../../libs/errors';
import { useGachaItem, useGachaItemUpdate } from '../_hooks/use-gacha';

export const Route = createFileRoute('/_authenticated/dashboard_/$id')({
  component: DashboardEditPage,
});

function DashboardEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const updateItem = useGachaItemUpdate();

  const { data: item, isLoading } = useGachaItem(id);

  const form = useForm<{ itemName: string; quantity: number }>({
    mode: 'all',
    defaultValues: { itemName: '', quantity: 1 },
  });

  useEffect(() => {
    if (item) {
      form.reset({ itemName: item.name, quantity: item.stock });
    }
  }, [item]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateItem.mutateAsync({
        id,
        name: data.itemName.trim(),
        stock: Number(data.quantity),
      });
      toast.success('Perubahan item berhasil dilakukan');
      navigate({ to: '/dashboard' });
    } catch (error) {
      toast.error(errorMessage(error, 'Perubahan item gagal dilakukan'));
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
            onClick={() => navigate({ to: '/dashboard' })}
            className="text-primary-500 hover:text-primary-600"
          >
            <ArrowLeftOutlined className="text-[20px]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Item Gacha</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <ControlledInputField
              control={form.control}
              label="Nama Hadiah"
              type="text"
              name="itemName"
              placeholder="Masukkan Nama Hadiah"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Quantity"
              type="number"
              name="quantity"
              placeholder="Masukkan Kuantitas Item"
              size="lg"
              className="w-full"
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                type="submit"
              >
                Perbarui Item
              </Button>
              <Button
                variant="bordered"
                size="lg"
                className="w-full"
                onClick={() => navigate({ to: '/dashboard' })}
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
