import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@imphnen-frontend-service/ui/atoms';
import {
  DataTable,
  BackofficeWrapper,
} from '@imphnen-frontend-service/ui/organisms';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { toast } from 'sonner';
import { errorMessage } from '../../libs/errors';
import { type TRoleItem, useRoleList, useRoleRemove } from './_hooks/use-roles';
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
  DeleteConfirmDialog,
} from '../../components/list-helpers';

export const Route = createFileRoute('/_authenticated/roles')({
  component: RolesPage,
});

function RolesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { can } = useCurrentUser();
  const { data: rolesData, isLoading } = useRoleList();
  const deleteRole = useRoleRemove();

  const keyword = search.trim().toLowerCase();
  const roles: TRoleItem[] = (rolesData?.items ?? []).filter(
    (role) =>
      !keyword ||
      role.label.toLowerCase().includes(keyword) ||
      role.key.toLowerCase().includes(keyword)
  );
  const totalItems = roles.length;

  const handleDelete = async (key: string) => {
    try {
      await deleteRole.mutateAsync({ key });
      toast.success('Data role berhasil dihapus');
      setDeleteId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Data role gagal dihapus'));
    }
  };

  const columns: ColumnDef<TRoleItem>[] = [
    {
      id: 'select',
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { header: 'Key', accessorKey: 'key' },
    { header: 'Roles Name', accessorKey: 'label' },
    {
      header: 'Tipe',
      accessorKey: 'fixed',
      cell: ({ row }) => (
        <Badge variant={row.original.fixed ? 'secondary' : 'info'}>
          {row.original.fixed ? 'Bawaan' : 'Kustom'}
        </Badge>
      ),
    },
    {
      header: 'Permissions',
      cell: ({ row }) => row.original.permissions.length,
    },
    { header: 'Pengguna', accessorKey: 'memberCount' },
    {
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: '/roles/$id', params: { id: row.original.key } });
            }}
          >
            <Pencil className="size-3.5" />
            {row.original.fixed || !can(PERMISSION.ROLE_UPDATE)
              ? 'Detail'
              : 'Update'}
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={
              row.original.fixed ||
              row.original.memberCount > 0 ||
              !can(PERMISSION.ROLE_DELETE)
            }
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.original.key);
            }}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: roles,
    columns,
    state: { pagination, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    manualPagination: false,
  });

  return (
    <BackofficeWrapper title="Roles" description="Kelola role dan akses">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama role…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
            {can(PERMISSION.ROLE_CREATE) && (
              <Button
                onClick={() => navigate({ to: '/roles/create' })}
                size="md"
              >
                <Plus className="size-4" />
                Tambah Role
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable data={roles} columns={columns} table={table} />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Hapus role ini?"
      />
    </BackofficeWrapper>
  );
}
