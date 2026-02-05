import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, getAuthCookieName, getServerCredentials, getSessionTtlSeconds } from '@/lib/serverAuth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = (await request.json()) as { username?: string; password?: string };
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    let creds: { username: string; password: string };
    try {
      creds = getServerCredentials();
    } catch {
      // Don't leak server config details to the client.
      return NextResponse.json({ success: false, error: 'Server auth is not configured' }, { status: 500 });
    }
    if (username !== creds.username || password !== creds.password) {
      return NextResponse.json({ success: false, error: 'Invalid username or password' }, { status: 401 });
    }

    let token: string;
    try {
      token = createSessionToken(username);
    } catch {
      // Don't leak server config details to the client.
      return NextResponse.json({ success: false, error: 'Server auth is not configured' }, { status: 500 });
    }
    const res = NextResponse.json(
      { success: true, data: { username, expiresAt: Date.now() + getSessionTtlSeconds() * 1000 } },
      { status: 200 }
    );

    res.cookies.set({
      name: getAuthCookieName(),
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: getSessionTtlSeconds(),
    });

    return res;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Login failed' }, { status: 500 });
  }
}

