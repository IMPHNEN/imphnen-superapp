import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Eye } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { MENTORING_SESSION_STATUS } from '@app/schemas';
import {
  isSessionStatus,
  SESSION_STATUS_TEXT,
  SESSION_STATUS_VARIANT,
} from './_components/session-dimentorin/session-status';
import {
  type TMentoringSession,
  useMentoringSessionList,
} from './_hooks/use-mentoring';
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
} from '../../components/list-helpers';

export const Route = createFileRoute('/_authenticated/session-dimentorin')({
  component: SessionDimentorinPage,
});

function SessionDimentorinPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: sessionsData, isLoading } = useMentoringSessionList({
    search: search || undefined,
    status: isSessionStatus(statusFilter) ? statusFilter : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const sessions: TMentoringSession[] = [...(sessionsData?.items ?? [])];
  const totalItems = sessionsData?.total ?? sessions.length;

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const columns: ColumnDef<TMentoringSession>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-10') },
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { id: 'id', header: 'ID Sesi', accessorKey: 'id' },
    {
      id: 'mentorName',
      header: 'Nama Mentor',
      cell: ({ row }) => row.original.mentor.name,
    },
    {
      id: 'menteeName',
      header: 'Nama Mentee',
      cell: ({ row }) => row.original.mentee.name,
    },
    { id: 'topic', header: 'Topik', accessorKey: 'topic' },
    {
      id: 'datetime',
      header: 'Waktu',
      accessorKey: 'scheduledAt',
      cell: ({ row }) => (
        <span>
          {new Date(row.original.scheduledAt).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={SESSION_STATUS_VARIANT[row.original.status]}>
          {SESSION_STATUS_TEXT[row.original.status]}
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
              to: '/session-dimentorin/$id',
              params: { id: row.original.id },
            });
          }}
        >
          <Eye className="size-3.5" />
          Detail
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: sessions,
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
      title="Session Management"
      description="Kelola sesi mentoring aktif"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama, email, atau topik…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                resetPage();
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {Object.values(MENTORING_SESSION_STATUS).map((status) => (
                  <SelectItem key={status} value={status}>
                    {SESSION_STATUS_TEXT[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable
              data={sessions}
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
