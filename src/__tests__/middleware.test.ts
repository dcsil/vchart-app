import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../middleware';

jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      redirect: jest.fn().mockImplementation((url) => ({ 
        redirectUrl: url, 
        type: 'redirect' 
      })),
      next: jest.fn().mockImplementation(() => ({ 
        type: 'next' 
      })),
    },
  };
});

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to create mock requests
  const createMockRequest = (pathname: string, authCookie?: string) => {
    return {
      nextUrl: { 
        pathname,
        origin: 'http://localhost',
        protocol: 'http',
      },
      url: 'http://localhost' + pathname,
      cookies: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'auth-session' && authCookie) {
            return { value: authCookie };
          }
          return undefined;
        }),
      },
    } as unknown as NextRequest;
  };

  it('should redirect to login page if user is not logged in', () => {
    const req = createMockRequest('/patients');
    
    middleware(req);
    
    // Should redirect to login
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/login' })
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it('should redirect to home page if logged in user tries to access login page', () => {
    const req = createMockRequest('/login', 'test-user');
    
    middleware(req);
    
    // Should redirect to home
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/' })
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it('should allow access to protected routes for logged in users', () => {
    const req = createMockRequest('/patients', 'test-user');
    
    middleware(req);
    
    // Should proceed normally
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('should allow access to login page for non-logged in users', () => {
    const req = createMockRequest('/login');
    
    middleware(req);
    
    // Should proceed normally
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });
}); 