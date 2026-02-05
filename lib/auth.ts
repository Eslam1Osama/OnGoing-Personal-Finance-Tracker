import { invalidateAllCache } from './cache';

export interface Session {
  authenticated: boolean;
  username?: string;
  expiresAt?: number;
}

export interface LoginResult {
  ok: boolean;
  error?: string;
  session?: Session;
}

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const json = (await res.json()) as any;
    if (!res.ok || !json?.success) {
      return { ok: false, error: json?.error || 'Invalid username or password' };
    }

    const data = json.data as { username: string; expiresAt: number };
    return { ok: true, session: { authenticated: true, username: data.username, expiresAt: data.expiresAt } };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Login failed' };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {
    // ignore
  } finally {
    // Security: clear cached financial data on logout
    invalidateAllCache();
  }
}

export async function getSession(): Promise<Session> {
  try {
    const res = await fetch('/api/auth/session', { method: 'GET', cache: 'no-store' });
    const json = (await res.json()) as any;
    if (!res.ok || !json?.success) return { authenticated: false };
    return json.data as Session;
  } catch {
    return { authenticated: false };
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return Boolean(session.authenticated);
}
