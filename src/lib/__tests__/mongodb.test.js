// Setting up environment variables for testing
const MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.MONGODB_URI = MONGODB_URI;

// Use jest.mock instead of require
jest.mock('mongoose', () => ({
  connect: jest.fn().mockImplementation(() => {
    return Promise.resolve({ connection: 'mocked-connection' });
  })
}));

jest.mock('@/app/utils/log', () => ({
  log: jest.fn()
}));

// Import mocked modules
import mongoose from 'mongoose';

describe('MongoDB Connection Utility', () => {
  let connectToDatabase;
  const originalEnv = process.env;
  const mockConnection = { connection: 'mocked-connection' };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    if (global.mongoose) {
      delete global.mongoose;
    }
    
    // Need to use dynamic import for this specific case
    connectToDatabase = jest.requireActual('../mongodb').default;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return cached connection on subsequent calls', async () => {
    global.mongoose = { conn: mockConnection, promise: Promise.resolve(mockConnection) };
    
    const connection = await connectToDatabase();
    
    expect(mongoose.connect).not.toHaveBeenCalled();
    expect(connection).toEqual(mockConnection);
  });

  it('should throw an error if MONGODB_URI is not defined', () => {
    const originalUri = process.env.MONGODB_URI;
    
    delete process.env.MONGODB_URI;
    
    jest.resetModules();
    
    expect(() => {
      jest.requireActual('../mongodb');
    }).toThrow('Please define MONGODB_URI in .env.local');
    
    process.env.MONGODB_URI = originalUri;
  });
}); 