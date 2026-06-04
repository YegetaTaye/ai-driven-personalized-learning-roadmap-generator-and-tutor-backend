import { test as base, type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

// ── Test account credentials (created by global-setup.ts) ────────────────────
export const TEST_USERS = {
  learner:    { email: 'e2e-learner@test.com',    password: 'E2eTest#123' },
  admin:      { email: 'e2e-admin@test.com',      password: 'E2eTest#123' },
  instructor: { email: 'e2e-instructor@test.com', password: 'E2eTest#123' },
} as const;

type Role = keyof typeof TEST_USERS;

interface AuthFixtures {
  auth: {
    loginAs: (role: Role) => Promise<void>;
    logout: () => Promise<void>;
  };
}

export const test = base.extend<AuthFixtures>({
  auth: async ({ page }: { page: Page }, use: (r: AuthFixtures['auth']) => Promise<void>) => {

    /**
     * Inject the pre-saved Zustand auth state directly into localStorage.
     * This avoids hitting the login API (and the auth rate-limiter) on
     * every test. global-setup.ts populates the .auth/*.json files.
     */
    const loginAs = async (role: Role) => {
      const statePath = path.join(__dirname, '..', '.auth', `${role}.json`);

      if (existsSync(statePath)) {
        const zustandState = readFileSync(statePath, 'utf-8');

        // Navigate to a plain page first so localStorage is accessible
        await page.goto('/login');
        await page.evaluate((state: string) => {
          localStorage.setItem('Yeneta-auth', state);
        }, zustandState);

        // Navigate to dashboard; the app reads the injected token immediately
        await page.goto('/dashboard');
        await page.waitForURL('**/dashboard', { timeout: 8_000 });
      } else {
        // Fallback: fill the form (slow but works if global-setup didn't run)
        const creds = TEST_USERS[role];
        await page.goto('/login');
        await page.fill('[type=email]', creds.email);
        await page.fill('[type=password]', creds.password);
        await page.click('[type=submit]');
        await page.waitForURL('**/dashboard', { timeout: 15_000 });
      }
    };

    const logout = async () => {
      await page.evaluate(() => {
        localStorage.removeItem('Yeneta-auth');
        sessionStorage.clear();
      });
      await page.goto('/login');
    };

    await use({ loginAs, logout });
  },
});

export { expect } from '@playwright/test';
