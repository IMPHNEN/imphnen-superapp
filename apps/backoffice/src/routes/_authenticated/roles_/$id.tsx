import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PERMISSION, type TPermission } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { ControlledInputField } from '@imphnen-frontend-service/ui/organisms';
import { errorMessage } from '../../../libs/errors';
import { PermissionPicker } from '../_components/roles/permission-picker';
import { usePermissionList, useRole, useRoleUpdate } from '../_hooks/use-roles';

export const Route = createFileRoute('/_authenticated/roles_/$id')({
  component: RolesEditPage,
});

type TRoleForm = {
  label: string;
  description: string;
  permissions: TPermission[];
};

function RolesEditPage() {
  const { id: key } = Route.useParams();
  const navigate = useNavigate();
  const { can } = useCurrentUser();
  const updateRole = useRoleUpdate();
  const { data: role, isLoading, isError } = useRole(key);
  const { data: permissionData } = usePermissionList();
  const readOnly = !role || role.fixed || !can(PERMISSION.ROLE_UPDATE);

  const form = useForm<TRoleForm>({
    mode: 'all',
    defaultValues: { label: '', description: '', permissions: [] },
  });
  const permissions = form.watch('permissions');

  useEffect(() => {
    if (role) {
      form.reset({
        label: role.label,
        description: role.description ?? '',
        permissions: [...role.permissions],
      });
    }
  }, [role]);

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateRole.mutateAsync({
        key,
        label: data.label.trim(),
        description: data.description.trim() || null,
        permissions: data.permissions,
      });
      toast.success('Perubahan role berhasil dilakukan');
      navigate({ to: '/roles' });
    } catch (error) {
      toast.error(errorMessage(error, 'Perubahan role gagal dilakukan'));
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
            type="button"
            onClick={() => navigate({ to: '/roles' })}
            className="text-primary-500 hover:text-primary-600"
          >
            <ArrowLeftOutlined className="text-[20px]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {readOnly ? 'Detail Role' : 'Edit Role'}
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {isError || !role ? (
            <div className="text-center py-8 text-neutral-400">
              Role tidak ditemukan.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-6">
              {role.fixed && (
                <p className="rounded-md bg-primary-50 px-4 py-3 text-sm text-neutral-700">
                  Role bawaan tidak bisa diubah. Buat role kustom untuk
                  kombinasi permission lain.
                </p>
              )}
              <ControlledInputField
                control={form.control}
                label="Nama Role"
                name="label"
                type="text"
                placeholder="Masukkan Nama Role"
                size="lg"
                className="w-full"
                disabled={readOnly}
              />
              <ControlledInputField
                control={form.control}
                label="Deskripsi"
                name="description"
                type="text"
                placeholder="Opsional"
                size="lg"
                className="w-full"
                disabled={readOnly}
              />

              <PermissionPicker
                permissions={permissionData?.items ?? []}
                value={permissions}
                onChange={(value) => form.setValue('permissions', value)}
                disabled={readOnly}
              />

              <div className="flex gap-3 pt-4">
                {!readOnly && (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    type="submit"
                    disabled={updateRole.isPending}
                  >
                    Update Role
                  </Button>
                )}
                <Button
                  variant="bordered"
                  size="lg"
                  className="w-full"
                  type="button"
                  onClick={() => navigate({ to: '/roles' })}
                >
                  {readOnly ? 'Kembali' : 'Batal'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
