import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Test configuration for dashboard screenshot capture
 */
interface DashboardTestCase {
  persona: 'user' | 'mentor';
  viewport: 'desktop' | 'mobile';
  roleName: string;
  waitForText: string;
  screenshotFileName: string;
}

/**
 * Session returned by the mocked `me.get` procedure, per persona.
 */
function createMockMe(persona: 'user' | 'mentor') {
  return {
    user: {
      id: 'mock-user-id',
      email: 'test@imphnen.com',
      name: 'Test User',
      role: persona,
      image: null,
    },
    permissions:
      persona === 'mentor'
        ? [
            'mentor:register',
            'mentor-profile:read',
            'mentor-profile:update',
            'mentoring-session:read',
            'mentoring-session:create',
            'mentoring-session:update',
          ]
        : [
            'mentor:register',
            'mentoring-session:read',
            'mentoring-session:create',
          ],
  };
}

const EMPTY_PAGE = { items: [], total: 0, page: 1, pageSize: 20 };

const MENTOR_STATS = {
  ratingAverage: null,
  ratingCount: 0,
  completedSessionCount: 0,
  menteesImpacted: 0,
  feedbackCount: 0,
  pendingSessionCount: 0,
  upcomingSessionCount: 0,
};

/**
 * oRPC answers (`/rpc/<module>/<procedure>`, body `{ json }`) used by the
 * dashboards.
 */
function rpcFixture(procedure: string, persona: 'user' | 'mentor'): unknown {
  switch (procedure) {
    case 'me/get':
      return createMockMe(persona);
    case 'mentoring/mentorStats':
      return MENTOR_STATS;
    case 'mentoring/listMine':
    case 'mentoring/menteeList':
      return EMPTY_PAGE;
    default:
      return null;
  }
}

/**
 * Dashboard test cases
 */
const testCases: DashboardTestCase[] = [
  {
    persona: 'user',
    viewport: 'desktop',
    roleName: 'user',
    waitForText: 'Your Roadmap',
    screenshotFileName: 'dashboard_user_mock_desktop.png',
  },
  {
    persona: 'mentor',
    viewport: 'desktop',
    roleName: 'mentor',
    waitForText: 'Analytics',
    screenshotFileName: 'dashboard_mentor_mock_desktop.png',
  },
  {
    persona: 'user',
    viewport: 'mobile',
    roleName: 'user',
    waitForText: 'Your Roadmap',
    screenshotFileName: 'dashboard_user_mock_mobile.png',
  },
  {
    persona: 'mentor',
    viewport: 'mobile',
    roleName: 'mentor',
    waitForText: 'Analytics',
    screenshotFileName: 'dashboard_mentor_mock_mobile.png',
  },
];

test.describe('Dashboard Screenshot Capture', () => {
  const screenshotDir = path.resolve(__dirname, '../screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  /**
   * Run test for each dashboard variant
   */
  for (const testCase of testCases) {
    test(`capture ${testCase.persona} ${testCase.viewport} dashboard screenshot`, async ({
      page,
    }) => {
      // Set viewport size based on device type
      const viewportSize =
        testCase.viewport === 'desktop'
          ? { width: 1280, height: 832 }
          : { width: 375, height: 667 };
      await page.setViewportSize(viewportSize);

      // Stub the oRPC API: the session and the dashboard procedures
      await page.route('**/rpc/**', async (route) => {
        const procedure = new URL(route.request().url()).pathname.replace(
          /^\/rpc\//,
          ''
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            json: rpcFixture(procedure, testCase.persona),
          }),
        });
      });

      // Navigate to dashboard with persona parameter for explicit override
      const dashboardUrl = `http://localhost:3000/dashboard?persona=${testCase.persona}`;
      await page.goto(dashboardUrl, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for stable dashboard content
      await page.waitForSelector(`text="${testCase.waitForText}"`, {
        timeout: 10000,
      });

      // Additional wait for content to render
      await page.waitForTimeout(1000);

      // Capture screenshot
      const screenshotPath = path.join(
        screenshotDir,
        testCase.screenshotFileName
      );
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      console.log(`✓ Captured: ${testCase.screenshotFileName}`);
    });
  }
});
