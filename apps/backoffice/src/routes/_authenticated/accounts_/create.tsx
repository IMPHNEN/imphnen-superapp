import { createFileRoute, useNavigate } from '@tanstack/react-router';
import * as React from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { ROLE } from '@app/permissions';
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  NativeSelect,
} from '@imphnen-frontend-service/ui/atoms';
import { InputField } from '@imphnen-frontend-service/ui/molecules';
import { BackofficeWrapper } from '@imphnen-frontend-service/ui/organisms';
import { errorMessage } from '../../../libs/errors';
import { useRoleList } from '../_hooks/use-roles';
import { useUserCreate } from '../_hooks/use-users';

export const Route = createFileRoute('/_authenticated/accounts_/create')({
  component: AccountsCreatePage,
});

const PASSWORD_MIN_LENGTH = 8;

function AccountsCreatePage() {
  const navigate = useNavigate();
  const createUser = useUserCreate();
  const { data: rolesData } = useRoleList();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<string>(ROLE.USER);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= PASSWORD_MIN_LENGTH &&
    !createUser.isPending;

  const handleSubmit = async () => {
    try {
      await createUser.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        isActive: true,
      });
      toast.success('Akun berhasil dibuat');
      navigate({ to: '/accounts' });
    } catch (error) {
      toast.error(errorMessage(error, 'Akun gagal dibuat'));
    }
  };

  return (
    <BackofficeWrapper title="Tambah Akun">
      <div className="mx-auto w-full max-w-2xl">
        <Button
          variant="text"
          size="sm"
          onClick={() => navigate({ to: '/accounts' })}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Tambah Akun</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <InputField
                label="Nama Lengkap"
                type="text"
                placeholder="Masukkan nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                size="md"
              />
              <InputField
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                size="md"
              />
              <InputField
                label="Password"
                type="password"
                placeholder={`Minimal ${PASSWORD_MIN_LENGTH} karakter`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                size="md"
              />
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
                  onChange={(e) => setRole(e.target.value)}
                >
                  {(rolesData?.items ?? []).map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            </div>
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
              disabled={!canSubmit}
            >
              {createUser.isPending ? 'Menyimpan…' : 'Tambah Akun'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </BackofficeWrapper>
  );
}
