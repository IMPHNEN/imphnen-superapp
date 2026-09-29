import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { Search, User, Pencil } from 'lucide-react';
import ModalUserDetail from './_components/hackathon-users/modal-user-detail';
import {
  BackofficeWrapper,
  DataTable,
} from '@imphnen-frontend-service/ui/organisms';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
} from '@imphnen-frontend-service/ui/atoms';
import { roleLabel } from '@app/messages';
import {
  type THackathonParticipant,
  useHackathonParticipantList,
} from './_hooks/use-hackathon';

type UserType = THackathonParticipant;

export const Route = createFileRoute('/_authenticated/hackathon-users')({
  component: HackathonUsersPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Number(search.page) || 1,
    search: (search.search as string) || '',
    per_page: Number(search.per_page) || 10,
  }),
});

function HackathonUsersPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const currentPage = Math.max(1, searchParams.page);
  const searchQuery = searchParams.search || '';
  const perPage = searchParams.per_page || 10;

  const [showDetailModal, setShowDetailModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(null);
  const [globalFilter, setGlobalFilter] = React.useState(searchQuery);

  const {
    data: usersResponse,
    isLoading,
    isFetching,
  } = useHackathonParticipantList({
    page: currentPage,
    pageSize: perPage,
    search: searchQuery || undefined,
  });

  const totalData = usersResponse?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalData / perPage));

  const handlePageChange = React.useCallback(
    (newPage: number) => {
      navigate({
        search: {
          page: newPage,
          per_page: perPage !== 10 ? perPage : undefined,
          search: searchQuery || undefined,
        } as any,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [navigate, perPage, searchQuery]
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
      } as any,
    });
  }, [globalFilter, navigate, perPage]);

  const handleShowDetailModal = React.useCallback((user: UserType) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  }, []);

  const filteredData = React.useMemo<UserType[]>(
    () => [...(usersResponse?.items ?? [])],
    [usersResponse]
  );

  const columns: ColumnDef<UserType>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarImage
                src={row.original.image ?? undefined}
                alt={row.original.name}
              />
              <AvatarFallback>
                <User className="size-4 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {row.original.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
        enableSorting: true,
      },
      {
        id: 'team',
        header: 'Team',
        cell: ({ row }) =>
          row.original.team ? (
            <span className="text-foreground">{row.original.team.name}</span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'location',
        header: 'Location',
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.location ?? '-'}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {roleLabel(row.original.role)}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'createdAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {new Date(row.original.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
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
            onClick={() => handleShowDetailModal(row.original)}
          >
            <Pencil className="size-3.5" />
            Manage
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [handleShowDetailModal]
  );

  return (
    <BackofficeWrapper
      title="Hackathon Users"
      description="IMPHNEN x Kolosal.ai Hackathon 2025"
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Cari nama atau email…"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <span>Memuat data users…</span>
            </div>
          ) : filteredData.length > 0 ? (
            <>
              <div className="text-xs text-muted-foreground">
                Menampilkan {filteredData.length} dari {totalData} users (page{' '}
                {currentPage} / {totalPages})
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
              Tidak ada user. Coba ubah filter pencarian.
            </div>
          )}
        </CardContent>
      </Card>

      <ModalUserDetail
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </BackofficeWrapper>
  );
}
