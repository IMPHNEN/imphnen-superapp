import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Filter as FilterIcon, Search, Pencil, Plus } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Badge,
} from '@imphnen-frontend-service/ui/atoms';
import {
  DataTable,
  Filter,
  BackofficeWrapper,
} from '@imphnen-frontend-service/ui/organisms';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { roleLabel } from '@app/messages';
import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { type TUserItem, useUserList } from './_hooks/use-users';

const STATUS_FILTER = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

const isActiveFilter = (value: string): boolean | undefined =>
  value === STATUS_FILTER.ALL ? undefined : value === STATUS_FILTER.ACTIVE;

export const Route = createFileRoute('/_authenticated/accounts')({
  component: AccountsPage,
});

function AccountsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [showFilter, setShowFilter] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<string>(
    STATUS_FILTER.ALL
  );
  const { can } = useCurrentUser();

  const { data: usersData, isLoading } = useUserList({
    search: search || undefined,
    isActive: isActiveFilter(statusFilter),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const users: TUserItem[] = [...(usersData?.items ?? [])];
  const totalItems = usersData?.total ?? users.length;

  const columns: ColumnDef<TUserItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(v) =>
            table.toggleAllRowsSelected(!!v && v !== 'indeterminate')
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    },
    {
      header: 'No',
      cell: ({ row }) =>
        pagination.pageIndex * pagination.pageSize + row.index + 1,
    },
    { header: 'Nama Lengkap', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => roleLabel(row.original.role),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
          {row.original.isActive ? 'Aktif' : 'Tidak Aktif'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: '/accounts/$id', params: { id: row.original.id } });
          }}
        >
          <Pencil className="size-3.5" /> Edit
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: users,
    columns,
    state: { pagination, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(totalItems / pagination.pageSize),
    manualPagination: true,
  });

  return (
    <BackofficeWrapper
      title="Data Akun"
      description="Kelola akun pengguna yang terdaftar"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama lengkap atau email…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              {can(PERMISSION.USER_CREATE) && (
                <Button
                  size="md"
                  onClick={() => navigate({ to: '/accounts/create' })}
                >
                  <Plus className="size-4" />
                  Tambah Akun
                </Button>
              )}
              <Popover open={showFilter} onOpenChange={setShowFilter}>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="md">
                    <FilterIcon className="size-4" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                  <Filter
                    onClose={() => setShowFilter(false)}
                    selectedValue={statusFilter}
                    onFilterChange={(value) => {
                      setStatusFilter(value);
                      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                    }}
                    options={[
                      { id: 'all', value: 'all', label: 'Semua' },
                      { id: 'active', value: 'active', label: 'Aktif' },
                      {
                        id: 'inactive',
                        value: 'inactive',
                        label: 'Tidak Aktif',
                      },
                    ]}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable
              data={users}
              columns={columns}
              table={table}
              manualPagination
              pageCount={Math.ceil(totalItems / pagination.pageSize)}
              currentPage={pagination.pageIndex + 1}
              onPageChange={(p) =>
                setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
              }
            />
          )}
        </CardContent>
      </Card>
    </BackofficeWrapper>
  );
}
