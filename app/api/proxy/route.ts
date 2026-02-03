import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';

// Request timeout in milliseconds (15 seconds - gives GAS time to respond)
const REQUEST_TIMEOUT = 15000;

// Read-only actions that can be cached briefly
const READ_ACTIONS = ['getBanks', 'getBills', 'getExpenses', 'getCashBalance', 'getNotesPlans', 'getDashboardSummary'];

/**
 * Create a fetch with timeout to prevent hanging requests
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Build the Google Apps Script URL with all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
    
    // Get body if present
    const body = await request.text();
    
    // Forward the request to Google Apps Script with timeout
    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Keep-alive for connection reuse
        'Connection': 'keep-alive',
      },
      body: body || undefined,
    }, REQUEST_TIMEOUT);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Google Apps Script error: ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Calculate response time for debugging
    const responseTime = Date.now() - startTime;
    
    // Determine cache control based on action type
    const isReadAction = action && READ_ACTIONS.includes(action);
    const cacheControl = isReadAction 
      ? 'private, max-age=5, stale-while-revalidate=10' // Brief cache for reads
      : 'no-store, no-cache, must-revalidate'; // No cache for writes
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': cacheControl,
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error: any) {
    // Handle timeout specifically
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout - please try again' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    // Build the Google Apps Script URL with all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
    
    // Forward the request to Google Apps Script with timeout
    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Connection': 'keep-alive',
      },
    }, REQUEST_TIMEOUT);
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Google Apps Script error: ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    const responseTime = Date.now() - startTime;
    
    // Determine cache control
    const isReadAction = action && READ_ACTIONS.includes(action);
    const cacheControl = isReadAction 
      ? 'private, max-age=5, stale-while-revalidate=10'
      : 'no-store, no-cache, must-revalidate';
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': cacheControl,
        'X-Response-Time': `${responseTime}ms`,
      },
    });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Request timeout - please try again' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400', // 24 hours preflight cache
    },
  });
}
