import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@imphnen-frontend-service/ui/atoms';
import { toast } from 'sonner';
import { MentorContactModal } from '../_components/modals/mentor-contact-modal';
import { MentoringFeedbackModal } from '../_components/modals/mentoring-feedback-modal';
import { MentoringDetailModal } from '../_components/modals/mentoring-detail-modal';
import {
  errorText,
  SESSION_STATUS,
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABEL,
  sessionTime,
  type TMentoringSession,
  useCancelSession,
  useMySessions,
} from '../_hooks/use-mentoring-sessions';

export const Route = createFileRoute(
  '/_authenticated/dashboard/user/mentoring'
)({
  component: MentoringPage,
});

const ROWS_PER_PAGE = 10;
const MENTOR_FALLBACK_IMAGE = '/image/mascot-character.webp';

const topicsOf = (session: TMentoringSession): string[] =>
  session.topic.split(', ');

const isOpen = (session: TMentoringSession): boolean =>
  session.status === SESSION_STATUS.PENDING ||
  session.status === SESSION_STATUS.CONFIRMED;

export function MentoringPage() {
  const [activeModal, setActiveModal] = useState<
    null | 'detail' | 'contact' | 'feedback'
  >(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selected, setSelected] = useState<TMentoringSession | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useMySessions({
    page: currentPage,
    pageSize: ROWS_PER_PAGE,
  });
  const cancelSession = useCancelSession();

  const sessions = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / ROWS_PER_PAGE));

  // listMine has no text search: filter the current page by mentor or topic.
  const pagedRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sessions;
    return sessions.filter(
      (session) =>
        session.mentor.name.toLowerCase().includes(term) ||
        session.topic.toLowerCase().includes(term)
    );
  }, [sessions, search]);

  const openModal = (
    session: TMentoringSession,
    modal: 'detail' | 'contact' | 'feedback'
  ) => {
    setSelected(session);
    setActiveModal(modal);
  };

  const handleCancel = (session: TMentoringSession) => {
    if (!globalThis.confirm('Batalkan sesi mentoring ini?')) return;
    cancelSession.mutate(
      { id: session.id },
      {
        onSuccess: () => toast.success('Sesi mentoring dibatalkan'),
        onError: (error) =>
          toast.error(errorText(error, 'Gagal membatalkan sesi')),
      }
    );
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const selectedTime = selected ? sessionTime(selected) : null;
  const selectedMentor = selected
    ? {
        name: selected.mentor.name,
        title: selected.mentor.email,
        email: selected.mentor.email,
        topics: topicsOf(selected),
        image: selected.mentor.image || MENTOR_FALLBACK_IMAGE,
      }
    : null;

  return (
    <section className="w-243">
      <Card className="w-full p-6">
        <div className="mb-4 relative">
          <Icon
            icon="lucide:search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-placeholder"
            width="16"
          />
          <Input
            type="text"
            size="lg"
            placeholder="Cari berdasarkan nama item"
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-sm border border-border-light">
          <Table>
            <TableHeader className="bg-primary-50">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox />
                </TableHead>
                <TableHead>No.</TableHead>
                <TableHead>Nama Mentor</TableHead>
                <TableHead>Topik</TableHead>
                <TableHead>Sesi Mentoring</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs">
                    Memuat sesi mentoring...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && pagedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-xs">
                    Belum ada sesi mentoring.
                  </TableCell>
                </TableRow>
              )}
              {pagedRows.map((row, index) => {
                const no = (currentPage - 1) * ROWS_PER_PAGE + index + 1;
                const time = sessionTime(row);
                return (
                  <TableRow
                    key={row.id}
                    className={no % 2 === 0 ? 'bg-primary-50' : 'bg-white'}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onCheckedChange={() => toggleSelectRow(row.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {no}.
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {row.mentor.name}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {row.topic}
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {`${time.date}, ${time.start} - ${time.end}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={SESSION_STATUS_BADGE[row.status]}>
                        {SESSION_STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="mx-auto flex w-50 items-center justify-center gap-2">
                        {row.status === SESSION_STATUS.COMPLETED && (
                          <Button
                            onClick={() => openModal(row, 'feedback')}
                            size="sm"
                            disabled={row.feedback !== null}
                          >
                            <Icon icon="lucide:search" width="12" />
                            {row.feedback !== null
                              ? 'Feedback Terkirim'
                              : 'Kirim Feedback'}
                          </Button>
                        )}
                        {isOpen(row) && (
                          <>
                            <Button
                              onClick={() => openModal(row, 'detail')}
                              size="sm"
                            >
                              <Icon icon="lucide:search" width="12" />
                              Cek Detail
                            </Button>
                            <Button
                              onClick={() => handleCancel(row)}
                              variant="danger"
                              size="sm"
                              disabled={cancelSession.isPending}
                            >
                              <Icon icon="lucide:x" width="12" />
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            className="flex items-center gap-2 text-[10px] font-semibold text-text-muted hover:text-primary-accent transition-colors"
          >
            <Icon icon="mdi:chevron-left" width="16" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, idx) => {
              const page = idx + 1;
              const isActive = page === currentPage;

              // Logic to show page numbers with ellipsis (simplified for now)
              if (totalPages > 7) {
                if (page > 4 && page < totalPages - 2 && page !== currentPage) {
                  if (page === 5)
                    return (
                      <span key="ellipsis" className="text-text-muted">
                        ...
                      </span>
                    );
                  return null;
                }
              }

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`h-7 min-w-7 px-2 rounded-sm text-[10px] font-semibold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-primary-accent text-white'
                      : 'bg-primary-100 text-primary-accent hover:bg-primary-100'
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            className="flex items-center gap-2 text-[10px] font-semibold text-text-muted hover:text-primary-accent transition-colors"
          >
            <Icon icon="mdi:chevron-right" width="16" />
          </button>
        </div>
      </Card>

      <MentorContactModal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        mentor={selectedMentor}
      />

      {selected && selectedMentor && selectedTime && (
        <MentoringDetailModal
          isOpen={activeModal === 'detail'}
          onClose={() => setActiveModal(null)}
          onContactMentor={() => setActiveModal('contact')}
          mentor={selectedMentor}
          session={{
            date: selectedTime.date,
            time: `${selectedTime.start} - ${selectedTime.end}`,
            location: selected.sessionType === 'offline' ? 'Offline' : 'Online',
            link: selected.meetingLink ?? undefined,
            description: selected.description ?? '',
          }}
        />
      )}

      <MentoringFeedbackModal
        isOpen={activeModal === 'feedback' && selected !== null}
        onClose={() => setActiveModal(null)}
        sessionId={selected?.id ?? null}
        mentorName={selectedMentor?.name || ''}
      />
    </section>
  );
}
