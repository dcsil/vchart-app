import { NextResponse } from 'next/server';
import { log } from "@/app/utils/log";

export async function POST() {
  try {
    // Create a response to clear the cookie
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Delete the auth session cookie
    response.cookies.set({
      name: 'auth-session',
      value: '',
      path: '/',
      maxAge: 0,
    });
    
    return response;
  } catch (error) {
    log('Logout error: ' + error, 'error');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 