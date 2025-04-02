import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../Navbar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

import { useRouter } from 'next/navigation';
import { log } from '@/app/utils/log';

describe('Navbar Component', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
    
    document.cookie = '';
  });

  it('should render the app name', () => {
    render(<Navbar />);
    expect(screen.getByText('VChart App')).toBeInTheDocument();
  });

  it('should not show username and logout button when not logged in', () => {
    render(<Navbar />);
    expect(screen.queryByText(/Welcome/)).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should show username and logout button when logged in', () => {
    document.cookie = 'auth-session=testuser; path=/';
    
    render(<Navbar />);
    expect(screen.getByText(/Welcome, testuser/)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should call logout API and redirect when logout button is clicked', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
    } as Response);
    
    document.cookie = 'auth-session=testuser; path=/';
    
    render(<Navbar />);
    
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });
    
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('should handle logout API errors', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
    } as Response);
    
    document.cookie = 'auth-session=testuser; path=/';
    
    render(<Navbar />);
    
    fireEvent.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Logout error'), 'error');
    });
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});