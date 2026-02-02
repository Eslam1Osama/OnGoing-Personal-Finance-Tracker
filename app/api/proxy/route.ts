import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';

export async function POST(request: NextRequest) {
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
    
    // Forward the request to Google Apps Script
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Google Apps Script error: ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!GOOGLE_APPS_SCRIPT_URL) {
      return NextResponse.json(
        { success: false, error: 'Google Apps Script URL not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Build the Google Apps Script URL with all query parameters
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.append(key, value);
    });
    
    const url = `${GOOGLE_APPS_SCRIPT_URL}?${params.toString()}`;
    
    // Forward the request to Google Apps Script
    const response = await fetch(url, {
      method: 'GET',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: `Google Apps Script error: ${response.statusText} - ${errorText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
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
    },
  });
}
