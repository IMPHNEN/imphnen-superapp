import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeftOutlined } from '@ant-design/icons';
import type { TPermission } from '@app/permissions';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { errorMessage } from '../../../libs/errors';
import { PermissionPicker } from '../_components/roles/permission-picker';
import { usePermissionList, useRoleCreate } from '../_hooks/use-roles';

export const Route = createFileRoute('/_authenticated/roles_/create')({
  component: RolesCreatePage,
});

type TRoleForm = {
  key: string;
  label: string;
  description: string;
  permissions: TPermission[];
};

function RolesCreatePage() {
  const navigate = useNavigate();
  const createRole = useRoleCreate();
  const { data: permissionData } = usePermissionList();

  const form = useForm<TRoleForm>({
    mode: 'all',
    defaultValues: { key: '', label: '', description: '', permissions: [] },
  });
  const permissions = form.watch('permissions');

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await createRole.mutateAsync({
        key: data.key.trim(),
        label: data.label.trim(),
        description: data.description.trim() || undefined,
        permissions: data.permissions,
      });
      toast.success('Data role berhasil ditambahkan');
      navigate({ to: '/roles' });
    } catch (error) {
      toast.error(errorMessage(error, 'Data role gagal ditambahkan'));
    }
  });

  return (
    <main className="w-full px-[48px] py-[40px] flex flex-col gap-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: '/roles' })}
            className="text-primary-500 hover:text-primary-600"
          >
            <ArrowLeftOutlined className="text-[20px]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Role</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            <ControlledInputField
              control={form.control}
              label="Key Role"
              name="key"
              type="text"
              placeholder="contoh: staff-gacha (huruf kecil, angka, - atau _)"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Nama Role"
              name="label"
              type="text"
              placeholder="Masukkan Nama Role"
              size="lg"
              className="w-full"
            />
            <ControlledInputField
              control={form.control}
              label="Deskripsi"
              name="description"
              type="text"
              placeholder="Opsional"
              size="lg"
              className="w-full"
            />

            <PermissionPicker
              permissions={permissionData?.items ?? []}
              value={permissions}
              onChange={(value) => form.setValue('permissions', value)}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                type="submit"
                disabled={createRole.isPending}
              >
                Tambah Role
              </Button>
              <Button
                variant="bordered"
                size="lg"
                className="w-full"
                type="button"
                onClick={() => navigate({ to: '/roles' })}
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
