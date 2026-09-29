import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { Filter as FilterIcon, Search, ClipboardCheck } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
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
import { GACHA_CLAIM_STATUS } from '@app/schemas';
import { toast } from 'sonner';
import ModalProcessDelivery from './_components/prizes/modal-process-item';
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
} from '../../components/list-helpers';
import { errorMessage } from '../../libs/errors';
import {
  type TGachaClaim,
  useGachaClaimFulfil,
  useGachaClaimList,
} from './_hooks/use-gacha';

type Status = TGachaClaim['status'];

const STATUS_FILTER_ALL = 'all';

export const Route = createFileRoute('/_authenticated/prizes')({
  component: PrizesPage,
});

function PrizesPage() {
  const [selectedClaim, setSelectedClaim] = React.useState<TGachaClaim | null>(
    null
  );
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [showFilter, setShowFilter] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState<string>(STATUS_FILTER_ALL);

  const { data: claimsData, isLoading } = useGachaClaimList({
    search: search || undefined,
    status:
      statusFilter === GACHA_CLAIM_STATUS.PENDING ||
      statusFilter === GACHA_CLAIM_STATUS.FULFILLED
        ? statusFilter
        : undefined,
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });
  const fulfilClaim = useGachaClaimFulfil();

  const claims: TGachaClaim[] = [...(claimsData?.items ?? [])];
  const totalItems = claimsData?.total ?? claims.length;

  const handleProcessDelivery = async (claim: TGachaClaim) => {
    try {
      await fulfilClaim.mutateAsync({ id: claim.id });
      toast.success('Hadiah ditandai sudah dikirim');
      setSelectedClaim(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Status pengiriman gagal diubah'));
    }
  };

  const deliveryOptions = [
    { id: STATUS_FILTER_ALL, value: STATUS_FILTER_ALL, label: 'Semua' },
    {
      id: GACHA_CLAIM_STATUS.PENDING,
      value: GACHA_CLAIM_STATUS.PENDING,
      label: 'Undelivered',
    },
    {
      id: GACHA_CLAIM_STATUS.FULFILLED,
      value: GACHA_CLAIM_STATUS.FULFILLED,
      label: 'Delivered',
    },
  ];

  const statusVariants: Record<Status, 'success' | 'destructive'> = {
    fulfilled: 'success',
    pending: 'destructive',
  };

  const statusText: Record<Status, string> = {
    fulfilled: 'Delivered',
    pending: 'Undelivered',
  };

  const columns: ColumnDef<TGachaClaim>[] = [
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
    { header: 'Nama Lengkap', cell: ({ row }) => row.original.user.name },
    { header: 'Email', cell: ({ row }) => row.original.user.email },
    { header: 'Items', cell: ({ row }) => row.original.item.name },
    {
      header: 'Tanggal Menang',
      accessorKey: 'createdAt',
      cell: ({ row }) =>
        new Date(row.original.createdAt).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <Badge variant={statusVariants[row.original.status]}>
          {statusText[row.original.status]}
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
            setSelectedClaim(row.original);
          }}
        >
          <ClipboardCheck className="size-3.5" />
          Process
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: claims,
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
      title="Data Pengiriman Hadiah"
      description="Proses pengiriman hadiah ke pemenang"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama, email, atau item…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              />
            </div>
            <Popover open={showFilter} onOpenChange={setShowFilter}>
              <PopoverTrigger asChild>
                <Button variant="secondary" size="md">
                  <FilterIcon className="size-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-0">
                <Filter
                  options={deliveryOptions}
                  title="Status"
                  selectedValue={statusFilter}
                  onClose={() => setShowFilter(false)}
                  onFilterChange={(value) => {
                    setStatusFilter(value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Memuat data…
            </div>
          ) : (
            <DataTable
              data={claims}
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

      <ModalProcessDelivery
        isOpen={!!selectedClaim}
        onClose={() => setSelectedClaim(null)}
        claim={selectedClaim}
        isProcessing={fulfilClaim.isPending}
        handleProcessDelivery={handleProcessDelivery}
      />
    </BackofficeWrapper>
  );
}
