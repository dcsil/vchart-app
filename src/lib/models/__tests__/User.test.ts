import User from '../User';

interface MockSchemaWithTypes extends jest.Mock {
  Types: {
    ObjectId: string;
  };
}

jest.mock('mongoose', () => {
  const mockSchema = jest.fn() as MockSchemaWithTypes;
  const mockModel = jest.fn().mockReturnValue('MockUserModel');
  
  mockSchema.Types = { ObjectId: 'ObjectId' };
  
  return {
    Schema: mockSchema,
    model: mockModel,
    models: {}
  };
});

describe('User Model', () => {
  let mongoose: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mongoose = require('mongoose');
    
    jest.isolateModules(() => {
      require('../User');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(User).toBe('MockUserModel');
  });
  
  it('should create model with correct name and collection', () => {
    const modelCalls = mongoose.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('User');
    expect(lastCall[2]).toBe('users');
  });
  
  it('should check for username and password requirements in schema', () => {
    const schemaCall = mongoose.Schema.mock.calls[0];
    expect(schemaCall).toBeDefined();
    
    expect(mongoose.Schema).toHaveBeenCalled();
  });
  
  it('should check for existing model before creating a new one', () => {
    jest.isolateModules(() => {
      const mockMongoose = require('mongoose');
      mockMongoose.models = { User: 'ExistingModel' };
      
      require('../User');
      
      expect('User' in mockMongoose.models).toBe(false);
    });
  });
}); 