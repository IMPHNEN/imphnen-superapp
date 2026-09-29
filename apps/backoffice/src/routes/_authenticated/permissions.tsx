import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { Search } from 'lucide-react';
import {
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
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
} from '../../components/list-helpers';
import { type TPermissionItem, usePermissionList } from './_hooks/use-roles';

export const Route = createFileRoute('/_authenticated/permissions')({
  component: PermissionsPage,
});

function PermissionsPage() {
  const [search, setSearch] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { data: permissionsData, isLoading } = usePermissionList();

  const keyword = search.trim().toLowerCase();
  const permissions: TPermissionItem[] = (permissionsData?.items ?? []).filter(
    (permission) =>
      !keyword ||
      permission.key.toLowerCase().includes(keyword) ||
      permission.label.toLowerCase().includes(keyword)
  );

  const columns: ColumnDef<TPermissionItem>[] = [
    {
      id: 'select',
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { header: 'No', cell: ({ row }) => row.index + 1 },
    {
      header: 'Key',
      accessorKey: 'key',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.key}</span>
      ),
    },
    { header: 'Name', accessorKey: 'label' },
  ];

  const table = useReactTable({
    data: permissions,
    columns,
    state: { pagination, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(permissions.length / pagination.pageSize),
    manualPagination: false,
  });

  return (
    <BackofficeWrapper
      title="Permissions"
      description="Daftar hak akses sistem (dikelola lewat kode, atur aksesnya di Roles)"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama permission…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable data={permissions} columns={columns} table={table} />
          )}
        </CardContent>
      </Card>
    </BackofficeWrapper>
  );
}
