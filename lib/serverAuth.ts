import crypto from 'crypto';

// Keep this file server-only (used by route handlers).
const PROD_COOKIE_NAME = '__Host-ongoing_session';
const DEV_COOKIE_NAME = 'ongoing_session';
const SESSION_TTL_SECONDS = 60 * 60; // 1 hour

type SessionPayload = {
  u: string; // username
  exp: number; // unix ms
  iat: number; // unix ms
};

function base64url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlToBuffer(input: string): Buffer {
  // Restore padding
  const padLen = (4 - (input.length % 4)) % 4;
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  return Buffer.from(padded, 'base64');
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return secret;
}

export function getAuthCookieName(): string {
  // `__Host-` cookies MUST be Secure; browsers will ignore them on http://localhost.
  // Use a dev-friendly name locally, keep hardened cookie in production.
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE_NAME : DEV_COOKIE_NAME;
}

export function getSessionTtlSeconds(): number {
  return SESSION_TTL_SECONDS;
}

export function getSessionMaxAgeMs(): number {
  return SESSION_TTL_SECONDS * 1000;
}

export function getServerCredentials(): { username: string; password: string } {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  if (!username || !password) {
    throw new Error('AUTH_USERNAME / AUTH_PASSWORD are not set');
  }
  return { username, password };
}

function sign(data: string, secret: string): string {
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  return base64url(sig);
}

export function createSessionToken(username: string, nowMs: number = Date.now()): string {
  const payload: SessionPayload = {
    u: username,
    iat: nowMs,
    exp: nowMs + getSessionMaxAgeMs(),
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = base64url(payloadStr);
  const sig = sign(payloadB64, getSecret());
  return `${payloadB64}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null, nowMs: number = Date.now()): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return null;

  const expectedSig = sign(payloadB64, getSecret());
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;

  try {
    const payloadJson = base64urlToBuffer(payloadB64).toString('utf8');
    const payload = JSON.parse(payloadJson) as SessionPayload;
    if (!payload?.u || typeof payload.exp !== 'number') return null;
    if (nowMs > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

