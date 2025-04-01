import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((body, options) => {
        return {
          status: options?.status || 200,
          json: async () => body,
        };
      }),
    },
  };
});

jest.mock('mongoose', () => {
  return {
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
  };
});

jest.mock('@/lib/mongodb', () => {
  return jest.fn().mockResolvedValue({});
});

// Mock the Patient model
jest.mock('@/lib/models/Patient', () => {
  return {
    find: jest.fn().mockResolvedValue([]),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn().mockResolvedValue({}),
    prototype: {
      save: jest.fn().mockResolvedValue({}),
    },
  };
});

// Mock the User model
jest.mock('@/lib/models/User', () => {
  return {
    findOne: jest.fn(),
    prototype: {
      save: jest.fn().mockResolvedValue({}),
    },
  };
});

jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

import connectToDatabase from '@/lib/mongodb';
import Patient from '@/lib/models/Patient';
import User from '@/lib/models/User';
import { log } from '@/app/utils/log';
import { GET, POST, DELETE } from '../route';
import mongoose from 'mongoose';

describe('Patients API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock patient
  const createMockPatient = (id = '123') => ({
    _id: id,
    firstName: 'John',
    lastName: 'Doe',
    roomNumber: '101',
    diagnosis: 'Flu',
    save: jest.fn().mockResolvedValue({}),
  });

  // Helper to create a mock user
  const createMockUser = (patients: string[] = []) => ({
    _id: 'user123',
    username: 'testuser',
    patients: patients.map(id => ({ toString: () => id })),
    save: jest.fn().mockResolvedValue({}),
  });

  describe('GET /api/patients', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock request without auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
        url: 'http://localhost:3000/api/patients',
      } as unknown as NextRequest;

      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 404 if user is not found', async () => {
      // Mock request with auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/patients',
      } as unknown as NextRequest;

      // Mock User.findOne to return null (user not found)
      (User.findOne as jest.Mock).mockResolvedValueOnce(null);

      const response = await GET(request);
      
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.message).toBe('User not found');
      
      expect(connectToDatabase).toHaveBeenCalled();
    });

    it('should return empty patients array if user has no patients', async () => {
      // Mock request with auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/patients',
      } as unknown as NextRequest;

      // Mock User.findOne to return a user with no patients
      (User.findOne as jest.Mock).mockResolvedValueOnce(createMockUser([]));
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.patients).toEqual([]);
    });

    it('should return a specific patient when id is provided', async () => {
      const patientId = '123';
      const mockPatient = createMockPatient(patientId);
      
      // Mock request with auth cookie and patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: `http://localhost:3000/api/patients?id=${patientId}`,
      } as unknown as NextRequest;

      // Mock User.findOne to return a user with the patient
      (User.findOne as jest.Mock).mockResolvedValueOnce(createMockUser([patientId]));
      
      // Mock Patient.findById to return the patient
      (Patient.findById as jest.Mock).mockResolvedValueOnce(mockPatient);
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.patient).toEqual(mockPatient);
    });
  });

  describe('POST /api/patients', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock request without auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
        json: jest.fn(),
      } as unknown as NextRequest;

      const response = await POST(request);
      
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock request with auth cookie but incomplete body
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          firstName: 'John',
          // Missing lastName, roomNumber, diagnosis
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toBe('All fields are required');
    });
  });

  describe('DELETE /api/patients', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock request without auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
        url: 'http://localhost:3000/api/patients?id=123',
      } as unknown as NextRequest;

      const response = await DELETE(request);
      
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 400 if patient ID is missing', async () => {
      // Mock request with auth cookie but no patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/patients',
      } as unknown as NextRequest;

      const response = await DELETE(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toBe('Patient ID is required');
    });
    
    it('should delete a patient successfully', async () => {
      const patientId = '123';
      const mockUser = createMockUser([patientId]);
      
      // Mock request with auth cookie and patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: `http://localhost:3000/api/patients?id=${patientId}`,
      } as unknown as NextRequest;
      
      // Mock User.findOne to return a user with the patient
      (User.findOne as jest.Mock).mockResolvedValueOnce(mockUser);
      
      const response = await DELETE(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.message).toBe('Patient deleted successfully');
      
      expect(Patient.findByIdAndDelete).toHaveBeenCalledWith(patientId);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });
}); 