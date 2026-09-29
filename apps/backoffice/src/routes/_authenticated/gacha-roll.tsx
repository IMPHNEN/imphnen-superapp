import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Pencil, Trash2, Plus } from 'lucide-react';
import {
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
  useReactTable,
  type RowSelectionState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import { errorMessage } from '../../libs/errors';
import {
  type TGachaItem,
  useGachaItemList,
  useGachaItemRemove,
} from './_hooks/use-gacha';
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
  DeleteConfirmDialog,
} from '../../components/list-helpers';

export const Route = createFileRoute('/_authenticated/gacha-roll')({
  component: GachaRollPage,
});

function GachaRollPage() {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const { data: itemsData, isLoading } = useGachaItemList({
    search: search || undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const deleteItem = useGachaItemRemove();

  const items: TGachaItem[] = [...(itemsData?.items ?? [])];
  const totalItems = itemsData?.total ?? items.length;

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id });
      toast.success('Item berhasil dihapus');
      setDeleteId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Item gagal dihapus'));
    }
  };

  const columns: ColumnDef<TGachaItem>[] = [
    {
      id: 'select',
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    {
      header: 'No',
      cell: ({ row }) =>
        pagination.pageIndex * pagination.pageSize + row.index + 1,
    },
    { header: 'Nama Item', accessorKey: 'name' },
    { header: 'Stok', accessorKey: 'stock' },
    { header: 'Chance Rate (bobot)', accessorKey: 'weight' },
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
                to: '/gacha-roll/$id',
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
      title="Gacha Roll"
      description="Kelola item hadiah gacha"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama item…"
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
            <Button
              onClick={() => navigate({ to: '/gacha-roll/create' })}
              size="md"
            >
              <Plus className="size-4" />
              Tambah Item
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
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Hapus item gacha ini?"
      />
    </BackofficeWrapper>
  );
}
