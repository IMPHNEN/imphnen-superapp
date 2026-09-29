import { createFileRoute } from '@tanstack/react-router';
import type * as React from 'react';
import {
  Users,
  UserCog,
  CalendarClock,
  Activity,
  CircleCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@imphnen-frontend-service/ui/atoms';
import { BackofficeWrapper } from '@imphnen-frontend-service/ui/organisms';
import { UserGrowthChart } from './_components/dashboard-dimentorin/chart/user-growth';
import { SessionStatusChart } from './_components/dashboard-dimentorin/chart/session-status';
import { PERMISSION } from '@app/permissions';
import { MENTOR_SORT, MENTORING_SESSION_STATUS } from '@app/schemas';
import { useCurrentUser } from '@imphnen-frontend-service/service/session';
import { useMentorPublicList, useMentorReviewList } from './_hooks/use-mentors';
import { useMentoringOverview } from './_hooks/use-mentoring';
import { useUserList } from './_hooks/use-users';
import { SESSION_STATUS_TEXT } from './_components/session-dimentorin/session-status';

const TOP_MENTOR_COUNT = 5;

export const Route = createFileRoute('/_authenticated/dashboard-dimentorin')({
  component: DashboardDimentorinPage,
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

function DashboardDimentorinPage() {
  const { can } = useCurrentUser();
  const { data: activeMentorData } = useMentorPublicList({
    page: 1,
    pageSize: TOP_MENTOR_COUNT,
    sortBy: MENTOR_SORT.RATING,
    sortDir: 'desc',
  });
  const { data: allMentorData } = useMentorReviewList(
    { page: 1, pageSize: 1 },
    can(PERMISSION.MENTOR_VERIFY)
  );
  const { data: userData } = useUserList(
    { page: 1, pageSize: 1 },
    can(PERMISSION.USER_READ)
  );
  const { data: overview } = useMentoringOverview();

  const totalMentors = allMentorData?.total ?? 0;
  const totalUsers = userData?.total ?? 0;
  const totalSessions = overview?.total ?? 0;
  const topMentors = activeMentorData?.items ?? [];
  const activeMentors = activeMentorData?.total ?? 0;
  const byStatus = overview?.byStatus ?? [];
  const completedSessions =
    byStatus.find((item) => item.status === MENTORING_SESSION_STATUS.COMPLETED)
      ?.count ?? 0;
  const topTopics = (overview?.topTopics ?? []).map(
    (item): [string, number] => [item.topic, item.count]
  );
  const statusSlices = byStatus.map((item) => ({
    name: SESSION_STATUS_TEXT[item.status],
    value: item.count,
  }));

  return (
    <BackofficeWrapper
      title="Dimentorin Overview"
      description="Ringkasan metrik platform mentoring"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Total Users" value={totalUsers} />
        <StatCard icon={UserCog} label="Total Mentors" value={totalMentors} />
        <StatCard
          icon={CalendarClock}
          label="Total Sessions"
          value={totalSessions}
        />
        <StatCard
          icon={Activity}
          label="Active Mentors"
          value={activeMentors}
        />
        <StatCard
          icon={CircleCheck}
          label="Completed Sessions"
          value={completedSessions}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>
              Pertumbuhan user dari waktu ke waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserGrowthChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Distribusi status sesi</CardDescription>
          </CardHeader>
          <CardContent>
            <SessionStatusChart data={statusSlices} />
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Mentors</CardTitle>
            <CardDescription>Mentor dengan rating tertinggi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[10%]">No.</TableHead>
                    <TableHead>Nama Lengkap</TableHead>
                    <TableHead>Avg Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topMentors.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    topMentors.map((mentor, index) => (
                      <TableRow key={mentor.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{mentor.name}</TableCell>
                        <TableCell>
                          {mentor.ratingAverage?.toFixed(1) ?? '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Booked Topics</CardTitle>
            <CardDescription>
              Topik mentoring paling banyak dibooking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[10%]">No.</TableHead>
                    <TableHead>Topik</TableHead>
                    <TableHead>Total Sesi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topTopics.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={3}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Belum ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    topTopics.map(([topic, count], index) => (
                      <TableRow key={topic}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{topic}</TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>
    </BackofficeWrapper>
  );
}
