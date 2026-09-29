import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import { Search, MessageSquare } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { MENTORING_LIMIT, MENTORING_SESSION_STATUS } from '@app/schemas';
import {
  type TMentoringSession,
  useMentoringSessionList,
} from './_hooks/use-mentoring';

const FILTER_ALL = 'all';

const FEEDBACK_FILTER = {
  DONE: 'done',
  TODO: 'todo',
} as const;

const RATING_OPTIONS = Array.from(
  { length: MENTORING_LIMIT.RATING_MAX - MENTORING_LIMIT.RATING_MIN + 1 },
  (_, index) => MENTORING_LIMIT.RATING_MAX - index
);

const hasFeedbackOf = (value: string): boolean | undefined =>
  value === FILTER_ALL ? undefined : value === FEEDBACK_FILTER.DONE;
import {
  SelectAllCheckbox,
  RowSelectCheckbox,
} from '../../components/list-helpers';

export const Route = createFileRoute(
  '/_authenticated/feedback-review-dimentorin'
)({
  component: FeedbackReviewDimentorinPage,
});

function FeedbackReviewDimentorinPage() {
  const [activeTab, setActiveTab] = React.useState<'mentoring' | 'platform'>(
    'mentoring'
  );
  const [ratingFilter, setRatingFilter] = React.useState<string>(FILTER_ALL);
  const [statusFilter, setStatusFilter] = React.useState<string>(FILTER_ALL);
  const [search, setSearch] = React.useState('');
  const [viewing, setViewing] = React.useState<TMentoringSession | null>(null);

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: sessionsData, isLoading } = useMentoringSessionList({
    status: MENTORING_SESSION_STATUS.COMPLETED,
    search: search || undefined,
    hasFeedback: hasFeedbackOf(statusFilter),
    rating: ratingFilter === FILTER_ALL ? undefined : Number(ratingFilter),
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
  });

  const sessions: TMentoringSession[] =
    activeTab === 'mentoring' ? [...(sessionsData?.items ?? [])] : [];
  const totalItems =
    activeTab === 'mentoring' ? (sessionsData?.total ?? sessions.length) : 0;

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }));

  const columns: ColumnDef<TMentoringSession>[] = [
    {
      id: 'select',
      meta: { cellClassName: cn('w-10') },
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => <RowSelectCheckbox row={row} />,
    },
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => <span>{row.original.mentee.name}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => <span>{row.original.mentee.email}</span>,
    },
    {
      id: 'mentor',
      header: 'Mentor',
      cell: ({ row }) => <span>{row.original.mentor.name}</span>,
    },
    {
      id: 'rating',
      header: 'Rating',
      accessorKey: 'rating',
      cell: ({ row }) => <span>{row.original.rating ?? '-'}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const hasRating = row.original.feedbackSubmittedAt !== null;
        return (
          <Badge variant={hasRating ? 'success' : 'info'}>
            {hasRating ? 'Done' : 'To Do'}
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          disabled={row.original.feedbackSubmittedAt === null}
          onClick={(e) => {
            e.stopPropagation();
            setViewing(row.original);
          }}
        >
          <MessageSquare className="size-3.5" />
          Lihat Feedback
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
      title="Feedback & Review"
      description="Review feedback dari mentoring & platform"
    >
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as 'mentoring' | 'platform');
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="mentoring">Mentoring</TabsTrigger>
                <TabsTrigger value="platform">Platform</TabsTrigger>
              </TabsList>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Cari nama mentor/mentee…"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      resetPage();
                    }}
                  />
                </div>
                <Select
                  value={ratingFilter}
                  onValueChange={(value) => {
                    setRatingFilter(value);
                    resetPage();
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Semua Rating</SelectItem>
                    {RATING_OPTIONS.map((rating) => (
                      <SelectItem key={rating} value={String(rating)}>
                        {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    resetPage();
                  }}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>Semua Status</SelectItem>
                    <SelectItem value={FEEDBACK_FILTER.DONE}>Done</SelectItem>
                    <SelectItem value={FEEDBACK_FILTER.TODO}>To Do</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value="mentoring" className="mt-4">
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
            </TabsContent>
            <TabsContent value="platform" className="mt-4">
              <div className="py-10 text-center text-sm text-muted-foreground">
                Platform feedback belum tersedia
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={!!viewing}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Feedback {viewing?.mentee.name}</DialogTitle>
            <DialogDescription>
              Sesi "{viewing?.topic}" bersama {viewing?.mentor.name} · Rating{' '}
              {viewing?.rating ?? '-'}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm text-neutral-700">
            {viewing?.feedback ?? '-'}
          </p>
        </DialogContent>
      </Dialog>
    </BackofficeWrapper>
  );
}
