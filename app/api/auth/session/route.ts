import { NextRequest, NextResponse } from 'next/server';
import { getAuthCookieName, verifySessionToken } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(getAuthCookieName())?.value;
    const payload = verifySessionToken(token);
    if (!payload) {
      return NextResponse.json({ success: true, data: { authenticated: false } }, { status: 200 });
    }

    return NextResponse.json(
      { success: true, data: { authenticated: true, username: payload.u, expiresAt: payload.exp } },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Session check failed' }, { status: 500 });
  }
}

