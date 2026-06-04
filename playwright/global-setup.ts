/**
 * Playwright global setup — runs once before all tests.
 *
 * 1. Upserts the three E2E test accounts directly in postgres (no API rate limit).
 * 2. Logs in as each role via the REST API and saves the resulting tokens to
 *    playwright/.auth/{role}.json so auth.fixture.ts can inject them directly
 *    into localStorage — zero login API calls during tests.
 */

import { execSync } from 'child_process';
import crypto from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:8080/api/v1';
const E2E_PASSWORD = 'E2eTest#123';

const TEST_USERS = [
  { email: 'e2e-learner@test.com',    fullName: 'E2E Learner',    role: 'learner'    },
  { email: 'e2e-admin@test.com',      fullName: 'E2E Admin',      role: 'admin'      },
  { email: 'e2e-instructor@test.com', fullName: 'E2E Instructor', role: 'instructor' },
] as const;

type Role = typeof TEST_USERS[number]['role'];

// ── Step 1: Upsert users via direct postgres ──────────────────────────────────

function hashPasswordInContainer(): string {
  return execSync(
    `docker exec backend-api-gateway-1 node -e "` +
    `const c=require('crypto');` +
    `const s=c.randomBytes(16).toString('hex');` +
    `const k=c.scryptSync('${E2E_PASSWORD}',s,64,{N:16384,r:8,p:1});` +
    `console.log(s+':'+k.toString('hex'));"`,
    { encoding: 'utf8' },
  ).trim();
}

function hashPasswordOnHost(): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const key  = crypto.scryptSync(E2E_PASSWORD, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${key.toString('hex')}`;
}

function upsertTestUsers(): void {
  const pwHash = (() => {
    try { return hashPasswordInContainer(); }
    catch { return hashPasswordOnHost(); }
  })();

  const values = TEST_USERS.map(
    (u) => `('${u.email}', '${pwHash}', '${u.fullName}', '${u.role}', NOW())`,
  ).join(',\n  ');

  const sql =
    `INSERT INTO users (email, "passwordHash", "fullName", role, "updatedAt") ` +
    `VALUES ${values} ` +
    `ON CONFLICT (email) DO UPDATE ` +
    `SET "passwordHash"=EXCLUDED."passwordHash", role=EXCLUDED.role, "updatedAt"=NOW();`;

  execSync(
    `docker exec backend-postgres-1 psql -U postgres -d learner_roadmap -c "${sql}"`,
    { stdio: 'pipe' },
  );
  console.log('  [setup] postgres upsert OK');
}

// ── Step 2: Login and save auth state per role ────────────────────────────────

interface LoginResponse {
  user: { id: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
}

async function loginAndSaveState(
  email: string,
  role: Role,
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: E2E_PASSWORD }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Login failed for ${email}: ${res.status} ${body}`);
  }

  const { user, accessToken, refreshToken } = (await res.json()) as LoginResponse;

  // Shape expected by Zustand persist ('Yeneta-auth' key)
  const zustandState = {
    state: { user, accessToken, refreshToken },
    version: 0,
  };

  const outPath = path.join(__dirname, '.auth', `${role}.json`);
  writeFileSync(outPath, JSON.stringify(zustandState, null, 2));
  console.log(`  [setup] ${role} auth saved → ${outPath}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default async function globalSetup(): Promise<void> {
  console.log('\n[global-setup] Upserting E2E test accounts…');
  try {
    upsertTestUsers();
  } catch (err) {
    console.warn('[global-setup] WARNING: postgres upsert failed —', (err as Error).message);
    console.warn('  Tests may fail if accounts do not exist yet.\n');
  }

  console.log('[global-setup] Saving auth state for each role…');
  for (const user of TEST_USERS) {
    await loginAndSaveState(user.email, user.role);
  }

  console.log('[global-setup] Done.\n');
}
