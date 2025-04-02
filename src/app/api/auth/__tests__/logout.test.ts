import { NextResponse } from 'next/server';
import { POST } from '../logout/route';

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

import { log } from '@/app/utils/log';

describe('Logout API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should clear the auth cookie and return 200', async () => {
    // Call the POST function directly
    const response = await POST();
    
    // Check response status and data
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Check cookie was cleared
    expect(response.cookies.set).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'auth-session',
        value: '',
        path: '/',
      })
    );
  });

  it('should handle errors and return 500', async () => {
    // Mock NextResponse.json to throw an error
    const mockError = new Error('Unknown error');
    (NextResponse.json as jest.Mock).mockImplementationOnce(() => {
      throw mockError;
    });
    
    await POST();
    
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Logout error'), 'error');
    
    // Check 500 response on subsequent call
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: 'Internal server error' },
      { status: 500 }
    );
  });
}); 