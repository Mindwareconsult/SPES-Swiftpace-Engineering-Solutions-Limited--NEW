import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';

export const SESSION_COOKIE_NAME = 'spes_cms_session';
export const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12 hours
export const TOKEN_TTL_MS = TOKEN_TTL_SECONDS * 1000;

const PRIVATE_ADMIN_DIR = path.resolve(process.cwd(), '.private_admin');
const CLAIMED_ADMIN_FILE = path.join(PRIVATE_ADMIN_DIR, 'credentials.json');

// In-memory fallback session secret when ADMIN_SESSION_SECRET is unset in preview
const EPHEMERAL_SESSION_SECRET = crypto.randomBytes(32).toString('hex');

// In-memory claimed fallback password hash (used when ADMIN_PASSWORD_HASH env var is not configured yet)
let memoryClaimedCredential: { username: string; passwordHash: string } | null = null;

// In-memory token revocation set for clean logout
const revokedTokens = new Map<string, number>();

// Sliding window IP rate limiter for login attempts
const loginFailures = new Map<string, number[]>();
const MAX_LOGIN_FAILURES = 10;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

function getSessionSecret(): string {
  const configured = (process.env.ADMIN_SESSION_SECRET || '').trim();
  if (configured.length >= 32) {
    return configured;
  }
  return EPHEMERAL_SESSION_SECRET;
}

export function getConfiguredAdminUsername(): string {
  return (process.env.ADMIN_USERNAME || '').trim() || 'spesadmin';
}

function readClaimedCredential(): { username: string; passwordHash: string } | null {
  if (memoryClaimedCredential) return memoryClaimedCredential;
  try {
    if (fs.existsSync(CLAIMED_ADMIN_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(CLAIMED_ADMIN_FILE, 'utf8')) as {
        username?: string;
        passwordHash?: string;
      };
      if (parsed?.username && parsed?.passwordHash) {
        memoryClaimedCredential = { username: parsed.username, passwordHash: parsed.passwordHash };
        return memoryClaimedCredential;
      }
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function writeClaimedCredential(username: string, passwordHash: string): void {
  memoryClaimedCredential = { username, passwordHash };
  try {
    fs.mkdirSync(PRIVATE_ADMIN_DIR, { recursive: true });
    fs.writeFileSync(
      CLAIMED_ADMIN_FILE,
      JSON.stringify({ username, passwordHash, claimedAt: new Date().toISOString() }, null, 2),
      { mode: 0o600 }
    );
  } catch {
    // Serverless read-only container uses memoryClaimedCredential
  }
}

export function isEnvAdminPasswordConfigured(): boolean {
  return Boolean((process.env.ADMIN_PASSWORD_HASH || '').trim());
}

export function needsInitialPasswordClaim(): boolean {
  if (isEnvAdminPasswordConfigured()) return false;
  return readClaimedCredential() === null;
}

export function claimInitialAdminPassword(usernameInput: string | undefined, newPassword: string): { username: string } {
  if (!needsInitialPasswordClaim()) {
    throw new Error('Administrator credentials are already configured.');
  }
  const username = (usernameInput || '').trim() || getConfiguredAdminUsername();
  if (newPassword.length < 8 || newPassword.length > 128) {
    throw new Error('Password must be between 8 and 128 characters.');
  }
  const hash = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(12));
  writeClaimedCredential(username, hash);
  return { username };
}

function verifyScryptHash(password: string, stored: string): boolean {
  // Format: scrypt:<saltHex>:<hashHex>
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  try {
    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function verifyAdminCredentials(username: string, password: string): { valid: boolean; username: string } {
  const envHash = (process.env.ADMIN_PASSWORD_HASH || '').trim();
  const envUser = getConfiguredAdminUsername();

  if (envHash) {
    if (username.trim().toLowerCase() !== envUser.toLowerCase()) {
      return { valid: false, username: envUser };
    }
    const valid = envHash.startsWith('scrypt:')
      ? verifyScryptHash(password, envHash)
      : bcrypt.compareSync(password, envHash);
    return { valid, username: envUser };
  }

  const claimed = readClaimedCredential();
  if (!claimed) {
    return { valid: false, username: envUser };
  }
  if (username.trim().toLowerCase() !== claimed.username.toLowerCase()) {
    return { valid: false, username: claimed.username };
  }
  return { valid: bcrypt.compareSync(password, claimed.passwordHash), username: claimed.username };
}

export interface SessionPayload {
  username: string;
  role: 'admin';
  jti: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  admin?: {
    username: string;
  };
}

export function issueSessionToken(username: string): { token: string; expiresAt: number } {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { username, role: 'admin', jti },
    getSessionSecret(),
    { algorithm: 'HS256', expiresIn: TOKEN_TTL_SECONDS }
  );
  return { token, expiresAt: Date.now() + TOKEN_TTL_MS };
}

export function revokeSessionToken(token: string | null): void {
  if (!token) return;
  try {
    const decoded = jwt.verify(token, getSessionSecret(), { algorithms: ['HS256'] }) as SessionPayload;
    if (decoded?.jti && decoded?.exp) {
      revokedTokens.set(decoded.jti, decoded.exp * 1000);
    }
  } catch {
    // Ignore already expired or invalid tokens
  }
}

export function extractSessionToken(req: Request): { token: string | null; source: 'bearer' | 'cookie' | null } {
  const auth = req.headers.authorization;
  if (auth && /^Bearer\s+/i.test(auth)) {
    const bearer = auth.replace(/^Bearer\s+/i, '').trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') {
      return { token: bearer, source: 'bearer' };
    }
  }
  const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return { token: cookieToken.trim(), source: 'cookie' };
  }
  return { token: null, source: null };
}

export function isAllowedOrigin(origin: string | undefined, req?: Request): boolean {
  if (!origin) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  if (req) {
    const host = (typeof req.headers.host === 'string' ? req.headers.host.trim() : '');
    const fwdHostRaw = req.headers['x-forwarded-host'];
    const fwdHost = typeof fwdHostRaw === 'string' ? fwdHostRaw.split(',')[0].trim() : '';
    if ((host && parsed.host === host) || (fwdHost && parsed.host === fwdHost)) {
      return true;
    }
  }

  if (process.env.NODE_ENV !== 'production' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
    return true;
  }

  const configured = [process.env.ALLOWED_ORIGINS, process.env.URL, process.env.DEPLOY_PRIME_URL]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(',')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  return configured.includes(`${parsed.protocol}//${parsed.host}`);
}

export function setSessionCookie(res: Response, req: Request, token: string): void {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps =
    req.secure ||
    (typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim() === 'https');

  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${TOKEN_TTL_SECONDS}`
  ];

  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(res: Response, req: Request): void {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const isHttps =
    req.secure ||
    (typeof forwardedProto === 'string' && forwardedProto.split(',')[0].trim() === 'https');

  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Max-Age=0'
  ];

  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function getClientIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (loginFailures.get(ip) || []).filter((ts) => now - ts < LOGIN_WINDOW_MS);
  loginFailures.set(ip, recent);
  return recent.length >= MAX_LOGIN_FAILURES;
}

export function recordLoginFailure(ip: string): void {
  const now = Date.now();
  const recent = (loginFailures.get(ip) || []).filter((ts) => now - ts < LOGIN_WINDOW_MS);
  recent.push(now);
  loginFailures.set(ip, recent);
}

export function clearLoginFailures(ip: string): void {
  loginFailures.delete(ip);
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const { token, source } = extractSessionToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Administrator authentication is required.' });
  }

  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
  if (source === 'cookie' && isMutation) {
    const hasCustomHeader = Boolean(req.headers['x-requested-with']);
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    if (!hasCustomHeader && !isAllowedOrigin(origin, req)) {
      return res.status(403).json({ error: 'CSRF validation failed.' });
    }
  }

  try {
    const decoded = jwt.verify(token, getSessionSecret(), { algorithms: ['HS256'] }) as SessionPayload;
    if (!decoded || decoded.role !== 'admin' || !decoded.username) {
      return res.status(401).json({ error: 'Invalid administrator session.' });
    }
    const expTime = revokedTokens.get(decoded.jti);
    if (expTime && expTime > Date.now()) {
      return res.status(401).json({ error: 'Session has been logged out. Please sign in again.' });
    }
    req.admin = { username: decoded.username };
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}
