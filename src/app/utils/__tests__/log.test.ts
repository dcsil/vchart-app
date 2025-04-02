import { log } from '../log';
import '@testing-library/jest-dom';

const mockFetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
  } as Response)
);

global.fetch = mockFetch;

const consoleSpy = jest.spyOn(console, 'error');

describe('log utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call fetch with the correct parameters', async () => {
    await log('Test message', 'info');
    
    expect(global.fetch).toHaveBeenCalledWith('/api/logtail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test message', level: 'info' }),
    });
  });

  it('should use debug as the default log level', async () => {
    await log('Test message');
    
    expect(global.fetch).toHaveBeenCalledWith('/api/logtail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Test message', level: 'debug' }),
    });
  });

  it('should log to console if fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    
    await log('Failed message', 'error');
    
    expect(consoleSpy).toHaveBeenCalledWith('Error logging message to server:', expect.any(Error));
  });

  it('should handle non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);
    
    await log('Another message', 'warn');
    
    expect(consoleSpy).toHaveBeenCalledWith('Failed to log message to server');
  });
}); 