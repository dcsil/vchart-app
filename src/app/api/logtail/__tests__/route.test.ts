import { NextRequest } from 'next/server';
import { POST } from '../route';

global.fetch = jest.fn();

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Logtail API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it('should send logs to BetterStack with default level', async () => {
    // Setup mock for successful API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const req = createMockRequest({ message: 'Test log message' });
    const response = await POST(req);
    const responseData = await response.json();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String), // URL
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': expect.stringContaining('Bearer ')
        }),
        body: expect.stringContaining('Test log message')
      })
    );

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.level).toBe('info'); // Default level

    expect(response.status).toBe(201);
    expect(responseData.message).toBe('Log sent successfully');
  });

  it('should send logs to BetterStack with custom level', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const req = createMockRequest({ 
      message: 'Test error message', 
      level: 'error' 
    });
    
    await POST(req);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.level).toBe('error');
  });

  it('should handle BetterStack API failures', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    });

    const req = createMockRequest({ message: 'Test log message' });
    const response = await POST(req);
    const responseData = await response.json();

    // Check console error was called
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send log to Better Stack')
    );

    expect(response.status).toBe(500);
    expect(responseData.message).toBe('Failed to send log');
  });

  it('should handle network errors when calling BetterStack', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const req = createMockRequest({ message: 'Test log message' });
    const response = await POST(req);
    const responseData = await response.json();
    expect(console.error).toHaveBeenCalledWith(
      'Error sending log to Better Stack:',
      expect.any(Error)
    );

    expect(response.status).toBe(500);
    expect(responseData.message).toBe('Failed to send log');
  });

  it('should handle invalid request bodies', async () => {
    const req = {
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
    } as unknown as NextRequest;

    const response = await POST(req);

    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData.error).toBe('Error processing log request');
  });
}); 