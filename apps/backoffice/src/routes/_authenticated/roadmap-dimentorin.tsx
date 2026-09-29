import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { ROADMAP_STATUS } from '@app/schemas';
import { errorMessage } from '../../libs/errors';
import {
  type TRoadmapItem,
  type TRoadmapStatus,
  useRoadmapList,
  useRoadmapRemove,
} from './_hooks/use-roadmap';

const STATUS_FILTER_ALL = 'all';

const isRoadmapStatus = (value: string): value is TRoadmapStatus =>
  Object.values<string>(ROADMAP_STATUS).includes(value);
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
  DeleteConfirmDialog,
} from '../../components/list-helpers';

export const Route = createFileRoute('/_authenticated/roadmap-dimentorin')({
  component: RoadmapDimentorinPage,
});

function RoadmapDimentorinPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<string>(STATUS_FILTER_ALL);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: roadmapData, isLoading } = useRoadmapList({
    search: search || undefined,
    status: isRoadmapStatus(statusFilter) ? statusFilter : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const deleteRoadmap = useRoadmapRemove();

  const items: TRoadmapItem[] = [...(roadmapData?.items ?? [])];
  const totalItems = roadmapData?.total ?? items.length;

  const handleDelete = async (id: string) => {
    try {
      await deleteRoadmap.mutateAsync({ id });
      toast.success('Roadmap berhasil dihapus');
      setDeletingId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Gagal menghapus roadmap'));
    }
  };

  const statusVariants: Record<TRoadmapStatus, 'warning' | 'info' | 'success'> =
    {
      upcoming: 'warning',
      in_progress: 'info',
      completed: 'success',
    };

  const statusText: Record<TRoadmapStatus, string> = {
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  const columns: ColumnDef<TRoadmapItem>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-10') },
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    { id: 'title', header: 'Title', accessorKey: 'title' },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'description',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-md">
          {row.original.description}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status] ?? 'secondary'}>
          {statusText[row.original.status] ?? row.original.status}
        </Badge>
      ),
    },
    { id: 'votes', header: 'Votes', accessorKey: 'votes' },
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
                to: '/roadmap-dimentorin/$id',
                params: { id: row.original.id },
              });
            }}
          >
            <Pencil className="size-3.5" />
            Edit
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

  const table = useReactTable({
    data: items,
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
      title="Content & Roadmap"
      description="Kelola AI roadmap dimentorin"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Cari judul roadmap…"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="md"
              onClick={() => navigate({ to: '/roadmap-dimentorin/create' })}
            >
              <Plus className="size-4" />
              Buat Roadmap
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable
              data={items}
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

      <DeleteConfirmDialog
        open={!!deletingId}
        onOpenChange={(o) => !o && setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Hapus roadmap ini?"
      />
    </BackofficeWrapper>
  );
}
