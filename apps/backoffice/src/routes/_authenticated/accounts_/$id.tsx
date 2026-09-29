import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { roleLabel } from '@app/messages';
import { PERMISSION } from '@app/permissions';
import { GACHA_CREDIT_GRANT_MAX } from '@app/schemas';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  NativeSelect,
} from '@imphnen-frontend-service/ui/atoms';
import { InputField } from '@imphnen-frontend-service/ui/molecules';
import { BackofficeWrapper } from '@imphnen-frontend-service/ui/organisms';
import { DeleteConfirmDialog } from '../../../components/list-helpers';
import { errorMessage } from '../../../libs/errors';
import { useGachaCreditGrant } from '../_hooks/use-gacha';
import { useRoleList } from '../_hooks/use-roles';
import {
  useUser,
  useUserRemove,
  useUserResetPassword,
  useUserSetActive,
  useUserUpdate,
} from '../_hooks/use-users';

export const Route = createFileRoute('/_authenticated/accounts_/$id')({
  component: AccountsEditPage,
});

const PASSWORD_MIN_LENGTH = 8;

function AccountsEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { me, can } = useCurrentUser();
  const isSelf = me?.user.id === id;

  const { data: user, isLoading, isError } = useUser(id);
  const { data: rolesData } = useRoleList(can(PERMISSION.ROLE_READ));
  const updateUser = useUserUpdate();
  const setActive = useUserSetActive();
  const removeUser = useUserRemove();
  const resetPassword = useUserResetPassword();
  const grantCredit = useGachaCreditGrant();

  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [creditAmount, setCreditAmount] = React.useState(1);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.name);
      setRole(user.role);
    }
  }, [user]);

  const roles = rolesData?.items ?? [];

  const handleSubmit = async () => {
    try {
      await updateUser.mutateAsync({
        id,
        name: fullName.trim(),
        role: can(PERMISSION.ROLE_READ) ? role : undefined,
      });
      toast.success('Data akun berhasil diperbarui');
      navigate({ to: '/accounts' });
    } catch (error) {
      toast.error(errorMessage(error, 'Data akun gagal diperbarui'));
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;
    try {
      await setActive.mutateAsync({ id, isActive: !user.isActive });
      toast.success(
        user.isActive ? 'Akun dinonaktifkan' : 'Akun berhasil diaktifkan'
      );
    } catch (error) {
      toast.error(errorMessage(error, 'Status akun gagal diubah'));
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword.mutateAsync({ id, password: newPassword });
      setNewPassword('');
      toast.success('Password berhasil direset');
    } catch (error) {
      toast.error(errorMessage(error, 'Password gagal direset'));
    }
  };

  const handleGrantCredit = async () => {
    try {
      const credit = await grantCredit.mutateAsync({
        userId: id,
        amount: creditAmount,
      });
      toast.success(`Kredit gacha ditambahkan. Saldo: ${credit.balance}`);
    } catch (error) {
      toast.error(errorMessage(error, 'Kredit gacha gagal ditambahkan'));
    }
  };

  const handleDelete = async () => {
    try {
      await removeUser.mutateAsync({ id });
      toast.success('Akun berhasil dihapus');
      navigate({ to: '/accounts' });
    } catch (error) {
      toast.error(errorMessage(error, 'Akun gagal dihapus'));
    }
  };

  return (
    <BackofficeWrapper title="Edit Data Akun">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <Button
          variant="text"
          size="sm"
          onClick={() => navigate({ to: '/accounts' })}
          className="-ml-2 self-start"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Data Akun</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Memuat data…
              </div>
            ) : isError || !user ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Akun tidak ditemukan.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <InputField
                  label="Nama Lengkap"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  size="md"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={user.email}
                  size="md"
                  readOnly
                  disabled
                />
                {can(PERMISSION.ROLE_READ) && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="account-role"
                      className="text-sm font-medium text-neutral-800"
                    >
                      Role
                    </label>
                    <NativeSelect
                      id="account-role"
                      value={role}
                      disabled={isSelf}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      {roles.map((item) => (
                        <option key={item.key} value={item.key}>
                          {item.label}
                        </option>
                      ))}
                      {!roles.some((item) => item.key === role) && (
                        <option value={role}>{roleLabel(role)}</option>
                      )}
                    </NativeSelect>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate({ to: '/accounts' })}
            >
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={
                !user ||
                !can(PERMISSION.USER_UPDATE) ||
                !fullName.trim() ||
                updateUser.isPending
              }
            >
              {updateUser.isPending ? 'Menyimpan…' : 'Perbarui Data'}
            </Button>
          </CardFooter>
        </Card>

        {user && can(PERMISSION.USER_ACTIVATE) && (
          <Card>
            <CardHeader>
              <CardTitle>Status Akun</CardTitle>
              <CardDescription>
                Akun nonaktif tidak bisa login dan sesinya diakhiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <Badge variant={user.isActive ? 'success' : 'destructive'}>
                {user.isActive ? 'Aktif' : 'Tidak Aktif'}
              </Badge>
              <Button
                variant={user.isActive ? 'danger' : 'success'}
                size="sm"
                disabled={isSelf || setActive.isPending}
                onClick={handleToggleActive}
              >
                {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
            </CardContent>
          </Card>
        )}

        {user && can(PERMISSION.USER_UPDATE) && (
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Minimal {PASSWORD_MIN_LENGTH} karakter. Semua sesi pengguna akan
                diakhiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <InputField
                label="Password Baru"
                type="password"
                placeholder="Masukkan password baru"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                size="md"
                className="w-full"
              />
              <Button
                variant="secondary"
                size="md"
                disabled={
                  newPassword.length < PASSWORD_MIN_LENGTH ||
                  resetPassword.isPending
                }
                onClick={handleResetPassword}
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        )}

        {user && can(PERMISSION.GACHA_CREDIT_GRANT) && (
          <Card>
            <CardHeader>
              <CardTitle>Kredit Gacha</CardTitle>
              <CardDescription>
                Tambahkan kredit gacha (maksimal {GACHA_CREDIT_GRANT_MAX} per
                pemberian).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <InputField
                label="Jumlah Kredit"
                type="number"
                min={1}
                max={GACHA_CREDIT_GRANT_MAX}
                value={creditAmount}
                onChange={(e) => setCreditAmount(Number(e.target.value))}
                size="md"
                className="w-full"
              />
              <Button
                variant="secondary"
                size="md"
                disabled={
                  !Number.isInteger(creditAmount) ||
                  creditAmount < 1 ||
                  creditAmount > GACHA_CREDIT_GRANT_MAX ||
                  grantCredit.isPending
                }
                onClick={handleGrantCredit}
              >
                Tambah Kredit
              </Button>
            </CardContent>
          </Card>
        )}

        {user && can(PERMISSION.USER_DELETE) && !isSelf && (
          <div className="flex justify-end">
            <Button
              variant="danger"
              size="md"
              onClick={() => setConfirmDelete(true)}
            >
              Hapus Akun
            </Button>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Hapus akun ini?"
        description="Akun dinonaktifkan dan disembunyikan dari daftar. Email tetap terpakai."
      />
    </BackofficeWrapper>
  );
}
