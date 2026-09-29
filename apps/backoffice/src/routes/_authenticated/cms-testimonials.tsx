import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { TESTIMONIAL_STATUS } from '@app/schemas';
import { toast } from 'sonner';
import { formatDate } from '../../libs/dates';
import { errorMessage } from '../../libs/errors';
import {
  type TTestimonialItem,
  type TTestimonialStatus,
  useTestimonialModerate,
  useTestimonialModerationList,
  useTestimonialRemove,
} from './_hooks/use-testimonials';

const STATUS_FILTER_ALL = 'all';

const STATUS_VARIANT: Record<
  TTestimonialStatus,
  'warning' | 'success' | 'destructive'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const STATUS_TEXT: Record<TTestimonialStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const isTestimonialStatus = (value: string): value is TTestimonialStatus =>
  Object.hasOwn(STATUS_TEXT, value);

export const Route = createFileRoute('/_authenticated/cms-testimonials')({
  component: CmsTestimonialsPage,
});

function CmsTestimonialsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [statusFilter, setStatusFilter] =
    React.useState<string>(STATUS_FILTER_ALL);

  const { data: testimonialsData, isLoading } = useTestimonialModerationList({
    search: search || undefined,
    status: isTestimonialStatus(statusFilter) ? statusFilter : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const deleteTestimonial = useTestimonialRemove();
  const moderateTestimonial = useTestimonialModerate();

  const testimonials: TTestimonialItem[] = [...(testimonialsData?.items ?? [])];
  const totalItems = testimonialsData?.total ?? testimonials.length;

  const handleDelete = async (id: string) => {
    try {
      await deleteTestimonial.mutateAsync({ id });
      toast.success('Data testimonial berhasil dihapus');
      setDeleteId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Data testimonial gagal dihapus'));
    }
  };

  const handleModerate = async (id: string, status: TTestimonialStatus) => {
    try {
      await moderateTestimonial.mutateAsync({ id, status });
      toast.success(`Testimonial ditandai ${STATUS_TEXT[status]}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Status testimonial gagal diubah'));
    }
  };

  const columns: ColumnDef<TTestimonialItem>[] = [
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
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
    },
    { header: 'User', accessorKey: 'authorName' },
    { header: 'Role', accessorKey: 'role' },
    {
      header: 'Content',
      accessorKey: 'content',
      cell: ({ row }) => {
        const content = row.original.content;
        return content.length > 80 ? `${content.substring(0, 80)}…` : content;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={STATUS_VARIANT[row.original.status]}>
          {STATUS_TEXT[row.original.status]}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.status !== TESTIMONIAL_STATUS.APPROVED && (
            <Button
              variant="success"
              size="sm"
              disabled={moderateTestimonial.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleModerate(row.original.id, TESTIMONIAL_STATUS.APPROVED);
              }}
            >
              <Check className="size-3.5" />
              Approve
            </Button>
          )}
          {row.original.status !== TESTIMONIAL_STATUS.REJECTED && (
            <Button
              variant="bordered"
              size="sm"
              disabled={moderateTestimonial.isPending}
              onClick={(e) => {
                e.stopPropagation();
                handleModerate(row.original.id, TESTIMONIAL_STATUS.REJECTED);
              }}
            >
              <X className="size-3.5" />
              Reject
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({
                to: '/cms-testimonials/$id',
                params: { id: row.original.id },
              });
            }}
          >
            <Pencil className="size-3.5" />
            Update
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.original.id);
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
    data: testimonials,
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
      title="CMS Testimonials"
      description="Kelola testimonial pengguna"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama user atau konten…"
                className="pl-9"
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
                <SelectItem value={STATUS_FILTER_ALL}>Semua Status</SelectItem>
                <SelectItem value={TESTIMONIAL_STATUS.PENDING}>
                  Pending
                </SelectItem>
                <SelectItem value={TESTIMONIAL_STATUS.APPROVED}>
                  Approved
                </SelectItem>
                <SelectItem value={TESTIMONIAL_STATUS.REJECTED}>
                  Rejected
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => navigate({ to: '/cms-testimonials/create' })}
              size="md"
            >
              <Plus className="size-4" />
              Tambah Testimonial
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
              data={testimonials}
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

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus testimonial ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Testimonial akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BackofficeWrapper>
  );
}
