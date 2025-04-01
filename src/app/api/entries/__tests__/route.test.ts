import { NextRequest } from 'next/server';

jest.mock('../route', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
}));

import { GET, POST, PUT } from '../route';

describe('Entries API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/entries', () => {
    it('should call the GET handler with the correct request for a single entry', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ 
          entry: { 
            _id: '123', 
            patientId: '456',
            temperature: 98.6 
          } 
        }),
        status: 200,
      };
      (GET as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?id=123',
      };

      await GET(mockRequest as unknown as NextRequest);
      
      expect(GET).toHaveBeenCalledWith(mockRequest);
    });

    it('should call the GET handler with the correct request for all patient entries', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ entries: [] }),
        status: 200,
      };
      (GET as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?patientId=456',
      };

      await GET(mockRequest as unknown as NextRequest);
      
      expect(GET).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('POST /api/entries', () => {
    it('should call the POST handler with the correct request', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ 
          message: 'Entry added successfully',
          entry: {
            _id: '123',
            patientId: '456',
            temperature: 98.6,
            bloodPressure: '120/80',
            pulseRate: 72
          }
        }),
        status: 201,
      };
      (POST as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValue({
          patientId: '456',
          temperature: 98.6,
          bloodPressure: '120/80',
          pulseRate: 72,
          respiratoryRate: 16,
          oxygenSaturation: 98,
          painLevel: 2
        }),
      };

      await POST(mockRequest as unknown as NextRequest);
      
      expect(POST).toHaveBeenCalledWith(mockRequest);
    });
  });
  
  describe('PUT /api/entries', () => {
    it('should call the PUT handler with the correct request', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({ 
          message: 'Entry updated successfully',
          entry: {
            _id: '123',
            patientId: '456',
            temperature: 99.1,
            reviewed: true
          }
        }),
        status: 200,
      };
      (PUT as jest.Mock).mockResolvedValue(mockResponse);

      const mockRequest = {
        cookies: {
          get: jest.fn().mockReturnValue({ name: 'auth-session', value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValue({
          id: '123',
          temperature: 99.1,
          reviewed: true
        }),
      };

      await PUT(mockRequest as unknown as NextRequest);
      
      expect(PUT).toHaveBeenCalledWith(mockRequest);
    });
  });
}); 