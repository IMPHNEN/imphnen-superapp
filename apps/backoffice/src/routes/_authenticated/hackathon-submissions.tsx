import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, Eye } from 'lucide-react';
import SubmissionModal from './_components/hackathon-submissions/submission-modal';
import {
  BackofficeWrapper,
  DataTable,
} from '@imphnen-frontend-service/ui/organisms';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@imphnen-frontend-service/ui/atoms';
import { HACKATHON_SUBMISSION_STATUS } from '@app/schemas';
import {
  type THackathonSubmission,
  type THackathonSubmissionStatus,
  useHackathonSubmissionList,
} from './_hooks/use-hackathon';

type SubmissionType = THackathonSubmission;

const isSubmissionStatus = (
  value: string
): value is THackathonSubmissionStatus =>
  Object.values<string>(HACKATHON_SUBMISSION_STATUS).includes(value);

export const Route = createFileRoute('/_authenticated/hackathon-submissions')({
  component: HackathonSubmissionsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || '',
    per_page: Number(search.per_page) || 10,
    status: (search.status as string) || 'all',
  }),
});

function HackathonSubmissionsPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const currentPage = Math.max(1, searchParams.page);
  const searchQuery = searchParams.search || '';
  const perPage = searchParams.per_page || 10;
  const statusFilter = searchParams.status || 'all';

  const [showSubmissionModal, setShowSubmissionModal] = React.useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    React.useState<SubmissionType | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState(searchQuery);

  const {
    data: submissionsResponse,
    isLoading,
    isFetching,
  } = useHackathonSubmissionList({
    page: currentPage,
    pageSize: perPage,
    status: isSubmissionStatus(statusFilter) ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const totalData = submissionsResponse?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));

  const handlePageChange = React.useCallback(
    (newPage: number) => {
      navigate({
        search: {
          page: newPage,
          per_page: perPage !== 10 ? perPage : undefined,
          search: searchQuery || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        } as any,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate, perPage, searchQuery, statusFilter]
  );

  React.useEffect(() => {
    if (!isLoading && totalPages > 0 && currentPage > totalPages) {
      navigate({ search: { page: totalPages } as any });
    }
  }, [currentPage, totalPages, navigate, isLoading]);

  React.useEffect(() => {
    setGlobalFilter(searchQuery);
  }, [searchQuery]);

  const handleSearch = React.useCallback(() => {
    navigate({
      search: {
        page: 1,
        per_page: perPage !== 10 ? perPage : undefined,
        search: globalFilter.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      } as any,
    });
  }, [globalFilter, navigate, perPage, statusFilter]);

  const filteredData = React.useMemo<SubmissionType[]>(
    () => [...(submissionsResponse?.items ?? [])],
    [submissionsResponse]
  );

  const statusVariants: Record<string, 'success' | 'warning' | 'secondary'> = {
    submitted: 'success',
    pending: 'warning',
  };

  const columns: ColumnDef<SubmissionType>[] = React.useMemo(
    () => [
      {
        accessorKey: 'projectName',
        header: 'Project Name',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.projectName}
          </span>
        ),
        enableSorting: true,
      },
      {
        id: 'team',
        header: 'Team',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.team.name}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge
            variant={statusVariants[row.original.status] ?? 'secondary'}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'submittedAt',
        header: 'Submitted',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {row.original.submittedAt
              ? new Date(row.original.submittedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : '-'}
          </span>
        ),
        enableSorting: true,
        sortingFn: 'datetime',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedSubmission(row.original);
              setShowSubmissionModal(true);
            }}
          >
            <Eye className="size-3.5" />
            View
          </Button>
        ),
        enableSorting: false,
      },
    ],
    []
  );

  return (
    <BackofficeWrapper
      title="Project Submissions"
      description="IMPHNEN x Kolosal.ai Hackathon 2025"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama project…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Memuat submissions…
            </div>
          ) : filteredData.length > 0 ? (
            <>
              <div className="mb-3 text-xs text-muted-foreground">
                Menampilkan {filteredData.length} dari {totalData} submissions
                (page {currentPage} / {totalPages})
                {isFetching && (
                  <span className="ml-2 text-primary-500">Updating…</span>
                )}
              </div>
              <DataTable
                data={filteredData}
                columns={columns}
                pageSize={perPage}
                manualPagination
                pageCount={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada submissions.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSubmission && (
        <SubmissionModal
          isOpen={showSubmissionModal}
          onClose={() => {
            setShowSubmissionModal(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />
      )}
    </BackofficeWrapper>
  );
}
