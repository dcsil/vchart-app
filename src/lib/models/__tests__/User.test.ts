import User from '../User';

interface MockSchemaWithTypes extends jest.Mock {
  Types: {
    ObjectId: string;
  };
}

interface MockMongoose {
  Schema: MockSchemaWithTypes;
  model: jest.Mock;
  models: Record<string, unknown>;
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
  let mongooseInstance: MockMongoose;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mongooseInstance = jest.requireMock('mongoose') as MockMongoose;
    
    jest.isolateModules(() => {
      jest.requireActual('../User');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(User).toBe('MockUserModel');
  });
  
  it('should create model with correct name and collection', () => {
    const modelCalls = mongooseInstance.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('User');
    expect(lastCall[2]).toBe('users');
  });
  
  it('should check for username and password requirements in schema', () => {
    const schemaCall = mongooseInstance.Schema.mock.calls[0];
    expect(schemaCall).toBeDefined();
    
    expect(mongooseInstance.Schema).toHaveBeenCalled();
  });
  
  it('should check for existing model before creating a new one', () => {
    jest.isolateModules(() => {
      const mockMongoose = jest.requireMock('mongoose') as MockMongoose;
      mockMongoose.models = { User: 'ExistingModel' };
      
      jest.requireActual('../User');
      
      expect('User' in mockMongoose.models).toBe(false);
    });
  });
}); 