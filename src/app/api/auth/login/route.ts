import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { log } from "@/app/utils/log";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();
    
    // Check if user exists
    const allUsers = await User.find();
    log('All users: ' + JSON.stringify(allUsers.map(u => u.username)), 'debug');
    const user = await User.findOne({ username, password });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create a response
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: { 
          username: user.username,
          // Don't send the password back to the client
        } 
      },
      { status: 200 }
    );
    
    // Set a session cookie directly on the response
    response.cookies.set({
      name: 'auth-session',
      value: username,
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    log('Login error: ' + error, 'error');
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 