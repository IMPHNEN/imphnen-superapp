import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
} from '@imphnen-frontend-service/ui/atoms';
import {
  errorText,
  hasStarted,
  SESSION_STATUS,
  SESSION_STATUS_BADGE,
  SESSION_STATUS_LABEL,
  sessionTime,
  type TMentoringSession,
  useCancelSession,
  useMySessions,
  useUpdateSession,
} from '../_hooks/use-mentoring-sessions';

/**
 * Mentee list page route.
 * Lists the mentor's booked sessions with the mentor-side actions of the
 * session state machine (approve, reject, complete).
 */
export const Route = createFileRoute(
  '/_authenticated/dashboard/mentor/list-mentee'
)({
  component: ListMenteePage,
});

const PAGE_SIZE = 50;

/**
 * List mentee page.
 * @returns JSX element for mentor list mentee route content.
 */
export function ListMenteePage() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { data, isLoading } = useMySessions({
    role: 'mentor',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const updateSession = useUpdateSession();
  const cancelSession = useCancelSession();
  const isBusy = updateSession.isPending || cancelSession.isPending;
  const rows = data?.items ?? [];

  const setStatus = (
    session: TMentoringSession,
    status: 'confirmed' | 'completed' | 'no_show',
    message: string
  ) =>
    updateSession.mutate(
      { id: session.id, status },
      {
        onSuccess: () => toast.success(message),
        onError: (error) =>
          toast.error(errorText(error, 'Gagal memperbarui sesi')),
      }
    );

  const reject = (session: TMentoringSession) => {
    if (!globalThis.confirm('Tolak sesi mentoring ini?')) return;
    cancelSession.mutate(
      { id: session.id },
      {
        onSuccess: () => toast.success('Sesi mentoring ditolak'),
        onError: (error) => toast.error(errorText(error, 'Gagal menolak sesi')),
      }
    );
  };

  const toggleRow = (id: string) =>
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );

  const renderAction = (row: TMentoringSession) => {
    if (row.status === SESSION_STATUS.PENDING) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() => setStatus(row, 'confirmed', 'Sesi disetujui')}
          >
            Lakukan Approval
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={isBusy}
            onClick={() => reject(row)}
          >
            Tolak
          </Button>
        </div>
      );
    }
    if (row.status === SESSION_STATUS.CONFIRMED && hasStarted(row)) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isBusy}
            onClick={() => setStatus(row, 'completed', 'Sesi selesai')}
          >
            Tandai Selesai
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={isBusy}
            onClick={() => setStatus(row, 'no_show', 'Sesi ditandai no show')}
          >
            No Show
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="w-[972px]">
      <Card className="p-6">
        <div className="overflow-hidden rounded-sm border border-border-light">
          <Table>
            <TableHeader className="bg-primary-50">
              <TableRow>
                <TableHead className="w-11">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-xs font-semibold text-text-label">
                  No.
                </TableHead>
                <TableHead className="text-xs font-semibold text-text-label">
                  Nama Mentee
                </TableHead>
                <TableHead className="text-xs font-semibold text-text-label">
                  Status
                </TableHead>
                <TableHead className="text-xs font-semibold text-text-label">
                  Mentoring Session
                </TableHead>
                <TableHead className="text-xs font-semibold text-text-label">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs">
                    Memuat sesi mentoring...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs">
                    Belum ada mentee yang booking sesi.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => {
                const isSelected = selectedRows.includes(row.id);
                const time = sessionTime(row);
                return (
                  <TableRow
                    key={row.id}
                    className={isSelected ? 'bg-[#eaf4ff]' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.id)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-text-muted">
                      {index + 1}
                    </TableCell>
                    <TableCell className="text-[15px] text-[#454545]">
                      {row.mentee.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={SESSION_STATUS_BADGE[row.status]}>
                        {SESSION_STATUS_LABEL[row.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[15px] text-[#454545]">
                      {`${time.weekday}, ${time.date} ${time.start} - ${time.end}`}
                    </TableCell>
                    <TableCell>{renderAction(row)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </section>
  );
}
