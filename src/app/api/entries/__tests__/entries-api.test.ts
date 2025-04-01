import { NextRequest, NextResponse } from 'next/server';

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

// Mock mongoose including ObjectId
jest.mock('mongoose', () => {
  return {
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id),
    },
  };
});

// Mock the mongodb connection
jest.mock('@/lib/mongodb', () => {
  return jest.fn().mockResolvedValue({});
});

// Mock the Entry model
jest.mock('@/lib/models/Entry', () => {
  const mockEntries = [
    {
      _id: 'entry1',
      patientId: 'patient1',
      temperature: '98.6',
      bloodPressure: '120/80',
      pulseRate: '72',
      respiratoryRate: '16',
      oxygenSaturation: '98',
      painLevel: '2',
      reviewed: false,
      createdAt: new Date('2023-01-01'),
      save: jest.fn().mockResolvedValue({}),
    },
    {
      _id: 'entry2',
      patientId: 'patient1',
      temperature: '99.1',
      bloodPressure: '122/82',
      pulseRate: '75',
      respiratoryRate: '18',
      oxygenSaturation: '97',
      painLevel: '3',
      reviewed: true,
      createdAt: new Date('2023-01-02'),
      save: jest.fn().mockResolvedValue({}),
    }
  ];

  return {
    find: jest.fn().mockImplementation(() => ({
      sort: jest.fn().mockResolvedValue(mockEntries),
    })),
    findById: jest.fn().mockImplementation((id) => {
      const entry = mockEntries.find(e => e._id === id);
      return Promise.resolve(entry);
    }),
    prototype: {
      save: jest.fn().mockResolvedValue({}),
    },
    mockEntries,
  };
});

// Mock the Patient model
jest.mock('@/lib/models/Patient', () => {
  const mockPatient = {
    _id: 'patient1',
    firstName: 'John',
    lastName: 'Doe',
    roomNumber: '101',
    diagnosis: 'Flu',
    entries: [],
    save: jest.fn().mockResolvedValue({}),
  };

  return {
    findById: jest.fn().mockImplementation((id) => {
      if (id === 'patient1') {
        return Promise.resolve(mockPatient);
      }
      return Promise.resolve(null);
    }),
    prototype: {
      save: jest.fn().mockResolvedValue({}),
    },
    mockPatient,
  };
});

// Mock the log function
jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

import connectToDatabase from '@/lib/mongodb';
import Entry from '@/lib/models/Entry';
import Patient from '@/lib/models/Patient';
import { log } from '@/app/utils/log';
import { GET, POST, PUT } from '../route';
import mongoose from 'mongoose';

describe('Entries API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/entries', () => {
    it('should return 401 if user is not authenticated', async () => {
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
        url: 'http://localhost:3000/api/entries',
      } as unknown as NextRequest;

      const response = await GET(request);
      
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 400 if neither patient ID nor entry ID is provided', async () => {
      // Mock request with auth cookie but no query params
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries',
      } as unknown as NextRequest;

      const response = await GET(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toBe('Patient ID or Entry ID is required');
    });

    it('should return a single entry when entry ID is provided', async () => {
      // Mock request with auth cookie and entry ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?id=entry1',
      } as unknown as NextRequest;

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.entry).toBeDefined();
      expect(responseData.entry._id).toBe('entry1');
      expect(connectToDatabase).toHaveBeenCalled();
    });

    it('should return 404 if entry ID is not found', async () => {
      // Mock request with auth cookie and invalid entry ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?id=nonexistent',
      } as unknown as NextRequest;

      (Entry.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await GET(request);
      
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.message).toBe('Entry not found');
    });

    it('should return all entries for a patient when patient ID is provided', async () => {
      // Mock request with auth cookie and patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?patientId=patient1',
      } as unknown as NextRequest;

      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.entries).toBeDefined();
      expect(responseData.entries.length).toBe(2);
      
      expect(Entry.find).toHaveBeenCalledWith({ patientId: 'patient1' });
    });

    it('should handle errors when fetching entries', async () => {
      // Mock request with auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        url: 'http://localhost:3000/api/entries?patientId=patient1',
      } as unknown as NextRequest;

      (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await GET(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.message).toBe('Failed to fetch entries');
      
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Error fetching entries'), 'error');
    });
  });

  describe('POST /api/entries', () => {
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

    it('should return 400 if patient ID is missing', async () => {
      // Mock request with auth cookie but missing patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          temperature: '98.6',
          bloodPressure: '120/80',
          // Missing patientId
        }),
      } as unknown as NextRequest;

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toBe('Patient ID is required');
    });

    it('should return 404 if patient is not found', async () => {
      // Mock request with auth cookie and invalid patient ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          patientId: 'nonexistent',
          temperature: '98.6',
          bloodPressure: '120/80',
        }),
      } as unknown as NextRequest;

      (Patient.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await POST(request);
      
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.message).toBe('Patient not found');
    });

    it('should handle errors when creating entry', async () => {
      // Mock request with auth cookie and entry data
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          patientId: 'patient1',
          temperature: '98.6',
        }),
      } as unknown as NextRequest;

      (connectToDatabase as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.message).toBe('Failed to add entry');
      
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Error adding entry'), 'error');
    });
  });

  describe('PUT /api/entries', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Mock request without auth cookie
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue(undefined),
        },
        json: jest.fn(),
      } as unknown as NextRequest;

      const response = await PUT(request);
      
      expect(response.status).toBe(401);
      const responseData = await response.json();
      expect(responseData.message).toBe('Authentication required');
    });

    it('should return 400 if entry ID is missing', async () => {
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          temperature: '99.1',
          // Missing id
        }),
      } as unknown as NextRequest;

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
      const responseData = await response.json();
      expect(responseData.message).toBe('Entry ID is required');
    });

    it('should return 404 if entry is not found', async () => {
      // Mock request with auth cookie and invalid entry ID
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          id: 'nonexistent',
          temperature: '99.1',
        }),
      } as unknown as NextRequest;

      (Entry.findById as jest.Mock).mockResolvedValueOnce(null);

      const response = await PUT(request);
      
      expect(response.status).toBe(404);
      const responseData = await response.json();
      expect(responseData.message).toBe('Entry not found');
    });

    it('should update an entry successfully', async () => {
      // Create mock entry data for update
      const updateData = {
        id: 'entry1',
        temperature: '99.1',
        reviewed: true,
      };
      
      // Create a mock entry that will be updated
      const mockEntry = {
        _id: 'entry1',
        patientId: 'patient1',
        temperature: '98.6',
        bloodPressure: '120/80',
        pulseRate: '72',
        respiratoryRate: '16',
        oxygenSaturation: '98',
        painLevel: '2',
        reviewed: false,
        save: jest.fn().mockResolvedValue({}),
      };
      
      (Entry.findById as jest.Mock).mockResolvedValueOnce(mockEntry);
      
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce(updateData),
      } as unknown as NextRequest;

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      const responseData = await response.json();
      expect(responseData.message).toBe('Entry updated successfully');
      expect(responseData.entry).toBeDefined();
      
      expect(mockEntry.temperature).toBe('99.1');
      expect(mockEntry.reviewed).toBe(true);
      
      expect(mockEntry.save).toHaveBeenCalled();
    });

    it('should handle errors when updating entry', async () => {
      // Mock request with auth cookie and update data
      const request = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: 'testuser' }),
        },
        json: jest.fn().mockResolvedValueOnce({
          id: 'entry1',
          temperature: '99.1',
        }),
      } as unknown as NextRequest;

      // Mock entry with save error
      const mockEntry = {
        _id: 'entry1',
        temperature: '98.6',
        save: jest.fn().mockRejectedValueOnce(new Error('Save error')),
      };
      (Entry.findById as jest.Mock).mockResolvedValueOnce(mockEntry);

      const response = await PUT(request);
      
      expect(response.status).toBe(500);
      const responseData = await response.json();
      expect(responseData.message).toBe('Failed to update entry');
      
      expect(log).toHaveBeenCalledWith(expect.stringContaining('Error updating entry'), 'error');
    });
  });
}); 