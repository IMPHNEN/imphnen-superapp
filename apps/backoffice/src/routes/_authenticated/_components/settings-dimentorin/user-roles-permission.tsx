import { DeleteOutlined, UserSwitchOutlined } from '@ant-design/icons';
import { Button } from '@imphnen-frontend-service/ui/atoms';
import { DataTable } from '@imphnen-frontend-service/ui/organisms';
import { cn } from '@imphnen-frontend-service/utils';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { useNavigate } from '@tanstack/react-router';
import { type FC, useState } from 'react';
import { toast } from 'sonner';
import { errorMessage } from '../../../../libs/errors';
import {
  type TRoleItem,
  useRoleList,
  useRoleRemove,
} from '../../_hooks/use-roles';

export const UserRolesPermission: FC = () => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 9,
  });

  const navigate = useNavigate();
  const { data: rolesData, isLoading } = useRoleList();
  const deleteRole = useRoleRemove();

  const roles: TRoleItem[] = [...(rolesData?.items ?? [])];
  const totalItems = roles.length;

  const handleDelete = async (key: string) => {
    try {
      await deleteRole.mutateAsync({ key });
      toast.success('Role berhasil dihapus');
    } catch (error) {
      toast.error(errorMessage(error, 'Role gagal dihapus'));
    }
  };

  const columns: ColumnDef<TRoleItem>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-20') },
      header: ({ table }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="rounded"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      id: 'role',
      header: 'Role',
      accessorKey: 'label',
    },
    {
      id: 'totalUser',
      header: 'Total Permissions',
      cell: ({ row }) => row.original.permissions.length,
    },
    {
      header: 'Action',
      meta: { cellClassName: cn('w-96') },
      cell: ({ row }) => (
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: '/roles/$id', params: { id: row.original.key } });
            }}
            className="flex items-center gap-2 w-max"
          >
            <UserSwitchOutlined className="text-[16px]" /> Manage Permissions
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={row.original.fixed || row.original.memberCount > 0}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.original.key);
            }}
            className="flex items-center gap-2 w-max"
          >
            <DeleteOutlined className="text-[16px]" /> Delete Role
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: roles,
    columns,
    state: {
      pagination,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    manualPagination: false,
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-p2 font-semibold text-neutral-700">
          User Roles & Permissions
        </h1>
        <Button type="button" onClick={() => navigate({ to: '/roles/create' })}>
          Add Role
        </Button>
      </div>

      <div className="bg-white shadow p-8 rounded-lg">
        {isLoading ? (
          <div className="text-center py-8 text-neutral-400">Loading...</div>
        ) : (
          <DataTable data={roles} columns={columns} table={table} />
        )}
      </div>
    </div>
  );
};
