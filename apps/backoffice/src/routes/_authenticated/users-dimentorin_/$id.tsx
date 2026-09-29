import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Icon } from '@iconify/react';
import { MENTOR_DOCUMENT_KIND, MENTOR_REVIEW_DECISION } from '@app/schemas';
import { PERMISSION } from '@app/permissions';
import { roleLabel } from '@app/messages';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { Button, Input, Textarea } from '@imphnen-frontend-service/ui/atoms';
import { cn, For, Show } from '@imphnen-frontend-service/utils';
import { type ReactNode, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '../../../components/list-helpers';
import { errorMessage } from '../../../libs/errors';
import {
  DETAIL_KIND,
  detailKindOf,
} from '../_components/users-dimentorin/detail-kind';
import {
  type TMentorDocumentKind,
  type TMentorPrivate,
  useMentorDocumentDownload,
  useMentorRemove,
  useMentorReview,
  useMentorVerify,
} from '../_hooks/use-mentors';
import { useUser } from '../_hooks/use-users';

const labelClass = cn(
  'text-neutral-800 text-[10px] font-semibold mb-1.5 inline-block md:text-xs md:mb-2 xl:text-[15px]'
);

const SOCIAL_LINKS: {
  icon: ReactNode;
  key: 'linkedinUrl' | 'githubUrl' | 'portfolioUrl';
  label: string;
}[] = [
  {
    icon: <Icon icon="mdi:linkedin" className="text-2xl" />,
    key: 'linkedinUrl',
    label: 'LinkedIn',
  },
  {
    icon: <Icon icon="mdi:github" className="text-2xl" />,
    key: 'githubUrl',
    label: 'Github',
  },
  {
    icon: <Icon icon="mingcute:meta-line" className="text-2xl" />,
    key: 'portfolioUrl',
    label: 'Portfolio',
  },
];

const TABS = {
  account: 'account profile',
  detail: 'detail profile',
} as const;
type TabType = (typeof TABS)[keyof typeof TABS];

const REVIEWABLE_STATUSES: readonly TMentorPrivate['status'][] = [
  'pending',
  'inactive',
];

export const Route = createFileRoute('/_authenticated/users-dimentorin_/$id')({
  component: UserDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    kind: detailKindOf(search.kind),
  }),
});

function UserDetailPage() {
  const { id } = Route.useParams();
  const { kind } = Route.useSearch();
  const navigate = useNavigate();
  const { can } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabType>(TABS.account);
  const [reviewNote, setReviewNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMentor = useMentorRemove();
  const verifyMentor = useMentorVerify();
  const downloadDocument = useMentorDocumentDownload();

  const isMentor = kind === DETAIL_KIND.MENTOR;
  const { data: mentor, isLoading: mentorLoading } = useMentorReview(
    id,
    isMentor
  );
  const { data: user, isLoading: userLoading } = useUser(
    isMentor ? undefined : id
  );

  const isLoading = isMentor ? mentorLoading : userLoading;
  const displayName = mentor?.name ?? user?.name ?? '-';
  const email = mentor?.email ?? user?.email ?? '-';
  const image = mentor?.image ?? user?.image ?? null;

  const handleDelete = async () => {
    try {
      await deleteMentor.mutateAsync({ id });
      toast.success('Mentor berhasil dihapus');
      navigate({ to: '/users-dimentorin' });
    } catch (error) {
      toast.error(errorMessage(error, 'Gagal menghapus mentor'));
    }
  };

  const handleReview = async (
    decision: (typeof MENTOR_REVIEW_DECISION)[keyof typeof MENTOR_REVIEW_DECISION]
  ) => {
    try {
      await verifyMentor.mutateAsync({
        id,
        decision,
        note: reviewNote.trim() || undefined,
      });
      setReviewNote('');
      toast.success(
        decision === MENTOR_REVIEW_DECISION.APPROVE
          ? 'Mentor disetujui'
          : 'Pengajuan mentor ditolak'
      );
    } catch (error) {
      toast.error(errorMessage(error, 'Gagal menyimpan keputusan review'));
    }
  };

  const handleDownload = (documentKind: TMentorDocumentKind) => {
    downloadDocument.mutate(
      { id, kind: documentKind },
      {
        onError: (error): void => {
          toast.error(errorMessage(error, 'Dokumen gagal diunduh'));
        },
      }
    );
  };

  if (isLoading) {
    return (
      <main className="w-full px-[48px] py-[40px]">
        <div className="text-center py-8 text-neutral-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="w-full px-[48px] py-[40px] flex flex-col gap-8">
      <div className="w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/users-dimentorin' })}
            className="text-primary-500 hover:text-primary-600"
          >
            <ArrowLeftOutlined className="text-[20px]" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Detail - {displayName}
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="bg-primary-50 px-6 py-3 text-neutral-800 text-p2 font-semibold mb-8">
            Detail - {displayName}
          </h2>

          <div className="flex gap-2 bg-primary-100 p-1.5 rounded-md w-max mb-8">
            <For data={Object.values(TABS)}>
              {(tab) => (
                <Button
                  key={tab}
                  variant="text"
                  className={cn(
                    'px-3 py-2 capitalize',
                    activeTab === tab && 'bg-white'
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              )}
            </For>
          </div>

          <Show condition={activeTab === TABS.account}>
            <div>
              <div className="flex items-center gap-x-8 mb-8">
                <div className="size-[100px] rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
                  {image ? (
                    <img
                      src={image}
                      alt="Profile"
                      className="w-full object-cover"
                    />
                  ) : (
                    <Icon
                      icon="mdi:account"
                      className="text-4xl text-neutral-400"
                    />
                  )}
                </div>
                <div>
                  <p className="text-p2 font-semibold">{displayName}</p>
                  <p className="text-neutral-400 font-medium">{email}</p>
                </div>
              </div>

              <div>
                <div className="mb-8">
                  <h3 className="mb-7 text-p2 font-semibold">
                    Informasi Pribadi
                  </h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className={labelClass}>Nama Lengkap</label>
                      <Input
                        type="text"
                        className="min-w-full w-full"
                        value={displayName}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Email</label>
                      <Input
                        type="email"
                        className="min-w-full w-full"
                        value={email}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <Input
                        type="text"
                        className="min-w-full w-full"
                        value={
                          mentor?.status ??
                          (user?.isActive ? 'active' : 'inactive')
                        }
                        readOnly
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        {isMentor ? 'Gender' : 'Role'}
                      </label>
                      <Input
                        type="text"
                        className="min-w-full w-full"
                        value={
                          isMentor
                            ? (mentor?.gender ?? '-')
                            : user
                              ? roleLabel(user.role)
                              : '-'
                        }
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {mentor && (
                  <div className="mb-8">
                    <h3 className="mb-7 text-p2 font-semibold">Dokumen</h3>
                    <div className="flex flex-wrap items-center gap-5">
                      <Button
                        type="button"
                        size="sm"
                        variant="bordered"
                        disabled={!mentor.hasCv || downloadDocument.isPending}
                        onClick={() => handleDownload(MENTOR_DOCUMENT_KIND.CV)}
                      >
                        {mentor.hasCv ? 'Unduh CV' : 'CV belum diunggah'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="bordered"
                        disabled={
                          !mentor.hasIdentityDocument ||
                          downloadDocument.isPending
                        }
                        onClick={() =>
                          handleDownload(MENTOR_DOCUMENT_KIND.IDENTITY)
                        }
                      >
                        {mentor.hasIdentityDocument
                          ? 'Unduh Dokumen Identitas'
                          : 'Dokumen identitas belum diunggah'}
                      </Button>
                      {mentor.cvLegacyUrl && (
                        <a
                          href={mentor.cvLegacyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary-600 underline"
                        >
                          CV lama
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {mentor && REVIEWABLE_STATUSES.includes(mentor.status) && (
                  <div className="mb-8">
                    <h3 className="mb-7 text-p2 font-semibold">
                      Review Pengajuan
                    </h3>
                    <div className="flex flex-col gap-4">
                      <Textarea
                        className="min-w-full w-full"
                        placeholder="Catatan review (opsional)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                      <div className="flex items-center gap-5">
                        <Button
                          type="button"
                          size="sm"
                          variant="success"
                          disabled={verifyMentor.isPending}
                          onClick={() =>
                            handleReview(MENTOR_REVIEW_DECISION.APPROVE)
                          }
                        >
                          Setujui Mentor
                        </Button>
                        {mentor.status === 'pending' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            disabled={verifyMentor.isPending}
                            onClick={() =>
                              handleReview(MENTOR_REVIEW_DECISION.REJECT)
                            }
                          >
                            Tolak Pengajuan
                          </Button>
                        )}
                      </div>
                      {!mentor.hasIdentityDocument && (
                        <p className="text-xs text-danger-500">
                          Persetujuan membutuhkan dokumen identitas.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {mentor?.reviewNote && (
                  <div className="mb-8">
                    <h3 className="mb-3 text-p2 font-semibold">
                      Catatan Review Terakhir
                    </h3>
                    <p className="text-p3 text-neutral-600">
                      {mentor.reviewNote}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="mb-7 text-p2 font-semibold">Status Akun</h3>
                  <div className="flex items-center gap-5">
                    {mentor && can(PERMISSION.MENTOR_DELETE) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() => setConfirmDelete(true)}
                      >
                        Hapus Mentor
                      </Button>
                    )}
                    {user && can(PERMISSION.USER_READ) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate({
                            to: '/accounts/$id',
                            params: { id: user.id },
                          })
                        }
                      >
                        Kelola Akun
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-x-5 mt-8">
                  <Button
                    type="button"
                    variant="bordered"
                    onClick={() => navigate({ to: '/users-dimentorin' })}
                  >
                    Kembali
                  </Button>
                </div>
              </div>
            </div>
          </Show>

          <Show condition={activeTab === TABS.detail}>
            <div>
              <div className="shadow rounded-lg p-8 mb-7">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-x-6">
                    <div className="size-[54px] rounded-full overflow-hidden bg-neutral-200 flex items-center justify-center">
                      {image ? (
                        <img
                          src={image}
                          alt="Profile"
                          className="w-full object-cover"
                        />
                      ) : (
                        <Icon
                          icon="mdi:account"
                          className="text-2xl text-neutral-400"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-p2 font-semibold text-neutral-800">
                        {displayName}
                      </h3>
                      <p className="text-p3 font-medium text-neutral-600">
                        {mentor
                          ? `${mentor.currentRole ?? ''} at ${mentor.currentCompany ?? ''}`
                          : user
                            ? roleLabel(user.role)
                            : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <For data={SOCIAL_LINKS}>
                    {({ icon, key, label }) => {
                      const url = mentor?.[key];
                      if (!url) return null;
                      return (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button
                            type="button"
                            size="sm"
                            className="flex items-center gap-x-2"
                          >
                            {icon}
                            {label}
                          </Button>
                        </a>
                      );
                    }}
                  </For>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-7">
                <div className="text-pretty px-8 py-10 rounded-lg shadow h-max">
                  <h3 className="text-p2 font-semibold text-neutral-800 mb-6">
                    Description
                  </h3>
                  <p className="text-p3 font-medium text-neutral-600">
                    {mentor?.bio ?? 'Tidak ada deskripsi.'}
                  </p>
                </div>
                <div className="px-8 py-10 rounded-lg shadow h-max">
                  <h3 className="text-p2 font-semibold text-neutral-800 mb-6">
                    Personal Informations
                  </h3>
                  <div className="grid gap-6">
                    <div className="flex items-center gap-x-5">
                      <div className="bg-primary-50 rounded-full p-2.5 flex items-center justify-center text-primary-500">
                        <Icon icon="ic:outline-mail" className="text-3xl" />
                      </div>
                      <div className="text-p3">
                        <p className="text-neutral-800 font-semibold">
                          {email}
                        </p>
                        <p className="text-neutral-600 font-medium">
                          Email Address
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-5">
                      <div className="bg-primary-50 rounded-full p-2.5 flex items-center justify-center text-primary-500">
                        <Icon icon="cil:phone" className="text-3xl" />
                      </div>
                      <div className="text-p3">
                        <p className="text-neutral-800 font-semibold">
                          {mentor?.phoneNumber ??
                            mentor?.phoneForVerification ??
                            '-'}
                        </p>
                        <p className="text-neutral-600 font-medium">
                          Phone Number
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-x-5">
                      <div className="bg-primary-50 rounded-full p-2.5 flex items-center justify-center text-primary-500">
                        <Icon
                          icon="ion:location-outline"
                          className="text-3xl"
                        />
                      </div>
                      <div className="text-p3">
                        <p className="text-neutral-800 font-semibold">
                          {mentor?.domicile ?? mentor?.location ?? '-'}
                        </p>
                        <p className="text-neutral-600 font-medium">Location</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </div>

      <DeleteConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        onConfirm={handleDelete}
        title="Hapus mentor ini?"
        description="Profil mentor dihapus dan role pengguna kembali menjadi user. Sesi yang ada tetap tersimpan."
      />
    </main>
  );
}
