import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Eye, Search, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@imphnen-frontend-service/ui/atoms';
import {
  BackofficeWrapper,
  DataTable,
} from '@imphnen-frontend-service/ui/organisms';
import { cn } from '@imphnen-frontend-service/utils';
import {
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type RowSelectionState,
  useReactTable,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { ROLE } from '@app/permissions';
import { errorMessage } from '../../libs/errors';
import {
  type TMentorPrivate,
  useMentorRemove,
  useMentorReviewList,
} from './_hooks/use-mentors';
import { type TUserItem, useUserList } from './_hooks/use-users';
import { DETAIL_KIND } from './_components/users-dimentorin/detail-kind';
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
  DeleteConfirmDialog,
} from '../../components/list-helpers';

export const Route = createFileRoute('/_authenticated/users-dimentorin')({
  component: UsersDimentorinPage,
});

function UsersDimentorinPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState<'mentor' | 'mentee'>(
    'mentor'
  );
  const [search, setSearch] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const listInput = {
    search: search || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  };
  const { data: mentorData, isLoading: mentorLoading } =
    useMentorReviewList(listInput);
  const { data: menteeData, isLoading: menteeLoading } = useUserList({
    ...listInput,
    role: ROLE.USER,
  });
  const deleteMentor = useMentorRemove();

  const mentors: TMentorPrivate[] = [...(mentorData?.items ?? [])];
  const mentees: TUserItem[] = [...(menteeData?.items ?? [])];
  const mentorTotal = mentorData?.total ?? mentors.length;
  const menteeTotal = menteeData?.total ?? mentees.length;

  const handleDelete = async (id: string) => {
    try {
      await deleteMentor.mutateAsync({ id });
      toast.success('Mentor berhasil dihapus');
      setDeletingId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Gagal menghapus mentor'));
    }
  };

  const statusVariantMap: Record<
    TMentorPrivate['status'],
    'success' | 'warning' | 'destructive' | 'secondary'
  > = {
    active: 'success',
    pending: 'warning',
    rejected: 'destructive',
    inactive: 'secondary',
  };

  const mentorColumns: ColumnDef<TMentorPrivate>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-10') },
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    {
      id: 'rating',
      header: 'Rating',
      accessorKey: 'ratingAverage',
      cell: ({ row }) => (
        <span>{row.original.ratingAverage?.toFixed(1) ?? '-'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge
          variant={statusVariantMap[row.original.status]}
          className="capitalize"
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                to: '/users-dimentorin/$id',
                params: { id: row.original.id },
                search: { kind: DETAIL_KIND.MENTOR },
              });
            }}
          >
            <Eye className="size-3.5" />
            Detail
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingId(row.original.id);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const menteeColumns: ColumnDef<TUserItem>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-10') },
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { id: 'name', header: 'Name', accessorKey: 'name' },
    { id: 'email', header: 'Email', accessorKey: 'email' },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'destructive'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
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
            navigate({
              to: '/users-dimentorin/$id',
              params: { id: row.original.id },
              search: { kind: DETAIL_KIND.USER },
            });
          }}
        >
          <Eye className="size-3.5" />
          Detail
        </Button>
      ),
    },
  ];

  const mentorTable = useReactTable({
    data: mentors,
    columns: mentorColumns,
    state: { pagination, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(mentorTotal / pagination.pageSize),
    manualPagination: true,
  });

  const menteeTable = useReactTable({
    data: mentees,
    columns: menteeColumns,
    state: { pagination, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    pageCount: Math.ceil(menteeTotal / pagination.pageSize),
    manualPagination: true,
  });

  return (
    <BackofficeWrapper
      title="Users Dimentorin"
      description="Manajemen mentor dan mentee"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama lengkap…"
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
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as 'mentor' | 'mentee');
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <TabsList>
              <TabsTrigger value="mentor" className="capitalize">
                Mentor ({mentorTotal})
              </TabsTrigger>
              <TabsTrigger value="mentee" className="capitalize">
                Mentee ({menteeTotal})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="mentor" className="mt-4">
              {mentorLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Memuat data…
                </div>
              ) : (
                <DataTable
                  data={mentors}
                  columns={mentorColumns}
                  table={mentorTable}
                  manualPagination
                  pageCount={Math.ceil(mentorTotal / pagination.pageSize)}
                  currentPage={pagination.pageIndex + 1}
                  onPageChange={(p) =>
                    setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
                  }
                />
              )}
            </TabsContent>
            <TabsContent value="mentee" className="mt-4">
              {menteeLoading ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Memuat data…
                </div>
              ) : (
                <DataTable
                  data={mentees}
                  columns={menteeColumns}
                  table={menteeTable}
                  manualPagination
                  pageCount={Math.ceil(menteeTotal / pagination.pageSize)}
                  currentPage={pagination.pageIndex + 1}
                  onPageChange={(p) =>
                    setPagination((prev) => ({ ...prev, pageIndex: p - 1 }))
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Hapus mentor ini?"
        description="Profil mentor dihapus dan role pengguna kembali menjadi user. Sesi yang ada tetap tersimpan."
      />
    </BackofficeWrapper>
  );
}
