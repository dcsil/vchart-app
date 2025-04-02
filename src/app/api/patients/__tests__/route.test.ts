import { NextRequest } from 'next/server';

jest.mock('../route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  DELETE: jest.fn(),
}));

import { GET, POST, DELETE } from '../route';

describe('Patients API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/patients', () => {
    it('should call the GET handler with the correct request', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ patients: [] }),
        status: 200,
      };
      (GET as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/patients',
      };

      await GET(mockRequest as unknown as NextRequest);
      
      expect(GET).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('POST /api/patients', () => {
    it('should call the POST handler with the correct request', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ message: 'Patient added successfully' }),
        status: 201,
      };
      (POST as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValue({
          firstName: 'John',
          lastName: 'Doe',
          roomNumber: '101',
          diagnosis: 'Flu',
        }),
      };

      await POST(mockRequest as unknown as NextRequest);
      
      expect(POST).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('DELETE /api/patients', () => {
    it('should call the DELETE handler with the correct request', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ message: 'Patient deleted successfully' }),
        status: 200,
      };
      (DELETE as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/patients?id=123',
      };

      await DELETE(mockRequest as unknown as NextRequest);
      
      expect(DELETE).toHaveBeenCalledWith(mockRequest);
    });
  });
}); 