import { NextRequest, NextResponse } from 'next/server';
import { POST } from '../login/route';

jest.mock('@/lib/mongodb', () => {
  return jest.fn();
});

jest.mock('@/lib/models/User', () => ({
  find: jest.fn(),
  findOne: jest.fn(),
}));

jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

jest.mock('next/server', () => {
  return {
    NextRequest: jest.requireActual('next/server').NextRequest,
    NextResponse: {
      json: jest.fn((data, options) => ({ 
        data, 
        options,
        cookies: {
          set: jest.fn(),
        }
      })),
    },
  };
});

import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/User';
import { log } from '@/app/utils/log';

describe('Login API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const createMockRequest = (body: any) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it('should return 400 if username or password is missing', async () => {
    // Test with missing username
    const requestWithoutUsername = createMockRequest({ password: 'testpassword' });
    await POST(requestWithoutUsername);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Username and password are required' },
      { status: 400 }
    );
    
    // Test with missing password
    const requestWithoutPassword = createMockRequest({ username: 'testuser' });
    await POST(requestWithoutPassword);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Username and password are required' },
      { status: 400 }
    );
  });

  it('should connect to the database', async () => {
    const mockRequest = createMockRequest({
      username: 'testuser',
      password: 'password123',
    });
    
    (User.find as jest.Mock).mockResolvedValue([]);
    (User.findOne as jest.Mock).mockResolvedValue(null);
    
    await POST(mockRequest);
    
    expect(connectToDatabase).toHaveBeenCalled();
  });

  it('should return 401 if user credentials are invalid', async () => {
    const mockRequest = createMockRequest({
      username: 'testuser',
      password: 'password123',
    });
    
    (User.find as jest.Mock).mockResolvedValue([{ username: 'someone' }]);
    (User.findOne as jest.Mock).mockResolvedValue(null);
    
    await POST(mockRequest);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Invalid username or password' },
      { status: 401 }
    );
  });

  it('should return 200 and set cookie for valid login', async () => {
    const username = 'testuser';
    const mockRequest = createMockRequest({
      username,
      password: 'password123',
    });
    
    (User.find as jest.Mock).mockResolvedValue([{ username }]);
    (User.findOne as jest.Mock).mockResolvedValue({ username });
    
    const response = await POST(mockRequest);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { 
        message: 'Login successful',
        user: { username }
      },
      { status: 200 }
    );
    
    expect(response.cookies.set).toHaveBeenCalledWith({
      name: 'auth-session',
      value: username,
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: expect.any(Boolean),
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it('should handle errors and return 500', async () => {
    const mockRequest = createMockRequest({
      username: 'testuser',
      password: 'password123',
    });
    
    const mockError = new Error('Database connection failed');
    (connectToDatabase as jest.Mock).mockRejectedValue(mockError);
    
    await POST(mockRequest);
    
    // Check error is logged
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Login error'), 'error');
    
    // Check 500 response
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 500 }
    );
  });
}); 