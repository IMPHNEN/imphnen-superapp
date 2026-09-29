import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import {
  Plus,
  UsersRound,
  UserMinus,
  UserCog,
  RefreshCcw,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@imphnen-frontend-service/ui/atoms';
import { BackofficeWrapper } from '@imphnen-frontend-service/ui/organisms';
import { PERMISSION } from '@app/permissions';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../../components/list-helpers';
import { errorMessage } from '../../libs/errors';
import {
  type TGachaItem,
  useGachaClaimList,
  useGachaItemList,
  useGachaItemRemove,
} from './_hooks/use-gacha';
import { useUserList } from './_hooks/use-users';

const COUNT_ONLY = { page: 1, pageSize: 1 } as const;
const EMPTY_STAT = '—';

const formatCount = (value: number | undefined): string =>
  value === undefined ? EMPTY_STAT : value.toLocaleString('id-ID');

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
});

type StatCardProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
};

function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="grid size-11 shrink-0 place-items-center rounded-md bg-primary-100 text-primary-600">
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-semibold leading-tight text-foreground">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const { can } = useCurrentUser();
  const canReadUsers = can(PERMISSION.USER_READ);

  const { data: usersData } = useUserList(COUNT_ONLY, canReadUsers);
  const { data: inactiveUsersData } = useUserList(
    { ...COUNT_ONLY, isActive: false },
    canReadUsers
  );
  const { data: claimsData } = useGachaClaimList(
    COUNT_ONLY,
    can(PERMISSION.GACHA_CLAIM_MANAGE)
  );
  const { data: gachaItemsData } = useGachaItemList({ page: 1, pageSize: 9 });
  const deleteItem = useGachaItemRemove();

  const gachaItems: TGachaItem[] = [...(gachaItemsData?.items ?? [])];

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync({ id });
      toast.success('Item berhasil dihapus');
      setDeleteId(null);
    } catch (error) {
      toast.error(errorMessage(error, 'Item gagal dihapus'));
    }
  };

  return (
    <BackofficeWrapper
      title="Gacha Dashboard"
      description="Ringkasan statistik & daftar item gacha"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={UsersRound}
          label="Participants"
          value={formatCount(usersData?.total)}
        />
        <StatCard
          icon={RefreshCcw}
          label="Gacha Items"
          value={formatCount(gachaItemsData?.total)}
        />
        <StatCard
          icon={UserCog}
          label="Redeem"
          value={formatCount(claimsData?.total)}
        />
        <StatCard
          icon={UserMinus}
          label="Inactive Users"
          value={formatCount(inactiveUsersData?.total)}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Gacha Items</CardTitle>
              <CardDescription>
                Daftar item yang tersedia di gacha
              </CardDescription>
            </div>
            <Button
              size="md"
              onClick={() => navigate({ to: '/dashboard/create' })}
            >
              <Plus className="size-4" />
              Tambah Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {gachaItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada item gacha.
            </p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {gachaItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-primary-700">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {item.code} · stok {item.stock}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="text" size="icon" aria-label="Actions">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          navigate({
                            to: '/dashboard/$id',
                            params: { id: item.id },
                          })
                        }
                      >
                        <Pencil />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteId(item.id)}
                      >
                        <Trash2 />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
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
