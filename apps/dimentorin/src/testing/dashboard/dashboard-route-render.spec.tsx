import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserDashboard } from '../../routes/_authenticated/dashboard/user/_components/user-dashboard';
import { MentorDashboard } from '../../routes/_authenticated/dashboard/mentor/_components/mentor-dashboard';
import { MentoringPage } from '../../routes/_authenticated/dashboard/user/mentoring';

/**
 * Dashboard render tests.
 * Component-level tests; the oRPC data hooks are replaced with fixtures.
 */

const session = (
  id: string,
  status: 'pending' | 'confirmed' | 'completed',
  feedback: string | null = null
) => ({
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  mentor: {
    userId: 'mentor-user',
    mentorId: 'mentor-profile',
    name: 'Senpai Satu',
    email: 'mentor1@imphnen.dev',
    image: null,
  },
  mentee: {
    userId: 'mentee-user',
    name: 'Kouhai',
    email: 'user1@imphnen.dev',
    image: null,
  },
  topic: 'Basic IT',
  description: null,
  scheduledAt: '2026-03-22T13:00:00.000Z',
  durationMinutes: 60,
  sessionType: 'online' as const,
  status,
  meetingLink: null,
  feedback,
  rating: feedback ? 5 : null,
  feedbackSubmittedAt: null,
});

const idleMutation = { mutate: vi.fn(), isPending: false };

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-router')>()),
  useNavigate: () => vi.fn(),
}));

vi.mock(
  '../../routes/_authenticated/dashboard/_hooks/use-mentoring-sessions',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('../../routes/_authenticated/dashboard/_hooks/use-mentoring-sessions')
    >()),
    useMySessions: () => ({
      isLoading: false,
      data: {
        items: [
          session('s-1', 'confirmed'),
          session('s-2', 'completed'),
          session('s-3', 'completed', 'Mantap sekali penjelasannya'),
        ],
        total: 3,
        page: 1,
        pageSize: 10,
      },
    }),
    useMentorStats: () => ({
      data: {
        ratingAverage: 4.5,
        ratingCount: 2,
        completedSessionCount: 7,
        menteesImpacted: 3,
        feedbackCount: 2,
        pendingSessionCount: 1,
        upcomingSessionCount: 1,
      },
    }),
    useCancelSession: () => idleMutation,
    useSubmitFeedback: () => idleMutation,
  })
);

describe('Dashboard Persona Rendering', () => {
  describe('UserDashboard Component', () => {
    it('should render welcome card title', () => {
      render(<UserDashboard />);
      expect(
        screen.getByText('Selamat Datang di Dimentorin.dev')
      ).toBeDefined();
    });

    it('should display overview metrics with the session count', () => {
      render(<UserDashboard />);
      expect(screen.getByText('Mentoring Session')).toBeDefined();
      expect(screen.getByText('Article Submitted')).toBeDefined();
      expect(screen.getByText('Article Published')).toBeDefined();
      expect(screen.getByText('3')).toBeDefined();
    });

    it('should display roadmap progress', () => {
      render(<UserDashboard />);
      expect(screen.getByText('Your Roadmap')).toBeDefined();
      expect(screen.getByText('Front End Basic')).toBeDefined();
      expect(screen.getByText('1/30 days milestones completed')).toBeDefined();
    });
  });

  describe('MentoringPage Component', () => {
    it('should render search input and table headings', () => {
      render(<MentoringPage />);
      expect(
        screen.getByPlaceholderText('Cari berdasarkan nama item')
      ).toBeDefined();
      expect(screen.getByText('Nama Mentor')).toBeDefined();
      expect(screen.getByText('Sesi Mentoring')).toBeDefined();
    });

    it('should display the actions allowed by each session status', () => {
      render(<MentoringPage />);
      expect(screen.getByText('Cek Detail')).toBeDefined();
      expect(screen.getByText('Cancel')).toBeDefined();
      expect(screen.getByText('Kirim Feedback')).toBeDefined();
      expect(screen.getByText('Feedback Terkirim')).toBeDefined();
    });
  });

  describe('MentorDashboard Component', () => {
    it('should render welcome card title', () => {
      render(<MentorDashboard />);
      expect(
        screen.getByText('Selamat Datang di Dimentorin.dev')
      ).toBeDefined();
    });

    it('should display the mentor stats', () => {
      render(<MentorDashboard />);
      expect(screen.getByText('Overviews')).toBeDefined();
      expect(screen.getByText('4.5')).toBeDefined();
      expect(screen.getByText('7')).toBeDefined();
    });
  });
});
