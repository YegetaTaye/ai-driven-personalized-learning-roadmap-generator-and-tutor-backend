import superagent from 'superagent';
import { pool } from '../../lib/db';
import { signJwt, parseDuration } from '../../lib/jwt';
import { hashPassword, verifyPassword, generateToken, hashToken } from '../../lib/password';
import { ApiError } from '../../utils/ApiError';
import config from '../../config';
import type { UserRecord, TokenPair } from './auth.types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function issueTokens(userId: string, role: string): TokenPair {
  const accessToken = signJwt(
    { sub: userId, role },
    parseDuration(config.jwt.expiresIn),
  );
  const refreshToken = generateToken();
  return { accessToken, refreshToken };
}

async function storeRefreshToken(userId: string, plainToken: string): Promise<void> {
  const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn) * 1000);
  await pool.query(
    'INSERT INTO refresh_tokens ("userId", "tokenHash", "expiresAt") VALUES ($1, $2, $3)',
    [userId, hashToken(plainToken), expiresAt],
  );
}

// Retry helper for transient network errors (used by OAuth exchanges)
async function retryRequest<T>(fn: () => Promise<T>, attempts = 3, delayMs = 300): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await fn();
    } catch (err) {
      lastErr = err;
      // small backoff
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function register(
  email: string,
  password: string,
  fullName: string,
): Promise<{ user: Pick<UserRecord, 'id' | 'email' | 'role'>; tokens: TokenPair }> {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    throw ApiError.conflict('Email already registered');
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query<Pick<UserRecord, 'id' | 'email' | 'role'>>(
    `INSERT INTO users (email, "passwordHash", "fullName", "updatedAt")
     VALUES ($1, $2, $3, NOW())
     RETURNING id, email, role`,
    [email, passwordHash, fullName],
  );
  const user = rows[0];

  const tokens = issueTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return { user, tokens };
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: Pick<UserRecord, 'id' | 'email' | 'role'>; tokens: TokenPair }> {
  const { rows } = await pool.query<Pick<UserRecord, 'id' | 'email' | 'role' | 'passwordHash'>>(
    'SELECT id, email, role, "passwordHash" FROM users WHERE email = $1',
    [email],
  );

  const user = rows[0];
  const validCredentials =
    user?.passwordHash != null && (await verifyPassword(password, user.passwordHash));

  if (!validCredentials) throw ApiError.unauthorized('Invalid credentials');

  const tokens = issueTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return { user: { id: user.id, email: user.email, role: user.role }, tokens };
}

export async function refreshTokens(plainToken: string): Promise<TokenPair> {
  const hash = hashToken(plainToken);
  const { rows } = await pool.query<{ id: string; userId: string; expiresAt: Date }>(
    'SELECT id, "userId", "expiresAt" FROM refresh_tokens WHERE "tokenHash" = $1',
    [hash],
  );

  const record = rows[0];
  if (!record || record.expiresAt < new Date()) throw ApiError.unauthorized('Invalid or expired refresh token');

  const { rows: userRows } = await pool.query<Pick<UserRecord, 'id' | 'role'>>(
    'SELECT id, role FROM users WHERE id = $1',
    [record.userId],
  );
  const user = userRows[0];
  if (!user) throw ApiError.unauthorized('User not found');

  await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [record.id]);
  const tokens = issueTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return tokens;
}

export async function logout(userId: string, plainToken: string): Promise<void> {
  await pool.query(
    'DELETE FROM refresh_tokens WHERE "userId" = $1 AND "tokenHash" = $2',
    [userId, hashToken(plainToken)],
  );
}

// ── OAuth ─────────────────────────────────────────────────────────────────────

interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

async function findOrCreateOAuthUser(
  profile: OAuthProfile,
): Promise<{ user: Pick<UserRecord, 'id' | 'email' | 'role'>; tokens: TokenPair }> {
  const { rows: existing } = await pool.query<Pick<UserRecord, 'id' | 'email' | 'role'>>(
    'SELECT id, email, role FROM users WHERE "oauthProvider" = $1 AND "oauthProviderId" = $2',
    [profile.provider, profile.providerId],
  );

  let user = existing[0];

  if (!user) {
    const { rows: byEmail } = await pool.query<Pick<UserRecord, 'id' | 'email' | 'role'>>(
      'SELECT id, email, role FROM users WHERE email = $1',
      [profile.email],
    );
    if (byEmail[0]) {
      await pool.query(
        'UPDATE users SET "oauthProvider" = $1, "oauthProviderId" = $2, "updatedAt" = NOW() WHERE id = $3',
        [profile.provider, profile.providerId, byEmail[0].id],
      );
      user = byEmail[0];
    } else {
      const { rows: created } = await pool.query<Pick<UserRecord, 'id' | 'email' | 'role'>>(
        `INSERT INTO users (email, "fullName", "oauthProvider", "oauthProviderId", "avatarUrl", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, email, role`,
        [profile.email, profile.fullName, profile.provider, profile.providerId, profile.avatarUrl],
      );
      user = created[0];
    }
  }

  const tokens = issueTokens(user.id, user.role);
  await storeRefreshToken(user.id, tokens.refreshToken);
  return { user, tokens };
}

export async function handleGoogleCallback(
  code: string,
): Promise<{ user: Pick<UserRecord, 'id' | 'email' | 'role'>; tokens: TokenPair }> {
  // Exchange authorization code for tokens
  let tokenRes;
  try {
    tokenRes = await retryRequest(() =>
      superagent
        .post('https://oauth2.googleapis.com/token')
        .type('form')
        .send({
          code,
          client_id: config.oauth.google.clientId,
          client_secret: config.oauth.google.clientSecret,
          redirect_uri: config.oauth.google.callbackUrl,
          grant_type: 'authorization_code',
        }),
    );
  } catch (err: unknown) {
    // Surface a clearer error to help debugging transient DNS/network issues
    throw ApiError.internal(`Failed to exchange Google OAuth code: ${(err as Error).message}`);
  }

  // Fetch user profile
  let userRes;
  try {
    userRes = await retryRequest(() =>
      superagent
        .get('https://www.googleapis.com/oauth2/v2/userinfo')
        .set('Authorization', `Bearer ${tokenRes.body.access_token as string}`),
    );
  } catch (err: unknown) {
    throw ApiError.internal(`Failed to fetch Google user info: ${(err as Error).message}`);
  }

  const g = userRes.body as { id: string; email: string; name: string; picture: string };
  if (!g?.email) throw ApiError.badRequest('Google account has no email');
  return findOrCreateOAuthUser({
    provider: 'google',
    providerId: g.id,
    email: g.email,
    fullName: g.name,
    avatarUrl: g.picture ?? null,
  });
}

export async function handleGithubCallback(
  code: string,
): Promise<{ user: Pick<UserRecord, 'id' | 'email' | 'role'>; tokens: TokenPair }> {
  // Exchange code for access token with retry
  let tokenRes;
  try {
    tokenRes = await retryRequest(() =>
      superagent
        .post('https://github.com/login/oauth/access_token')
        .accept('application/json')
        .send({
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          code,
        }),
    );
  } catch (err: unknown) {
    throw ApiError.internal(`Failed to exchange GitHub OAuth code: ${(err as Error).message}`);
  }

  const accessToken = tokenRes.body.access_token as string;

  // Fetch profile and emails with retry
  let userRes;
  let emailsRes;
  try {
    [userRes, emailsRes] = await Promise.all([
      retryRequest(() =>
        superagent
          .get('https://api.github.com/user')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('User-Agent', 'learner-roadmap-app'),
      ),
      retryRequest(() =>
        superagent
          .get('https://api.github.com/user/emails')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('User-Agent', 'learner-roadmap-app'),
      ),
    ]);
  } catch (err: unknown) {
    throw ApiError.internal(`Failed to fetch GitHub profile/emails: ${(err as Error).message}`);
  }

  const gh = userRes.body as { id: number; name: string; avatar_url: string; login: string };
  const emails = emailsRes.body as { email: string; primary: boolean; verified: boolean }[];
  const primaryEmail = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email;

  if (!primaryEmail) throw ApiError.badRequest('GitHub account has no accessible email');

  return findOrCreateOAuthUser({
    provider: 'github',
    providerId: String(gh.id),
    email: primaryEmail,
    fullName: gh.name ?? gh.login,
    avatarUrl: gh.avatar_url ?? null,
  });
}
