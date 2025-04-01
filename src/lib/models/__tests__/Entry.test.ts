import Entry from '../Entry';

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
  const mockModel = jest.fn().mockReturnValue('MockEntryModel');
  
  mockSchema.Types = { ObjectId: 'ObjectId' };
  
  return {
    Schema: mockSchema,
    model: mockModel,
    models: {}
  };
});

describe('Entry Model', () => {
  let mongooseInstance: MockMongoose;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked mongoose instance
    mongooseInstance = jest.requireMock('mongoose') as MockMongoose;
    
    jest.isolateModules(() => {
      // This is a dynamic import during test, which is allowed
      jest.requireActual('../Entry');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(Entry).toBe('MockEntryModel');
  });
  
  it('should create model with correct name and collection', () => {
    const modelCalls = mongooseInstance.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('Entry');
    expect(lastCall[2]).toBe('entries');
  });
  
  it('should check for existing model before creating a new one', () => {
    jest.isolateModules(() => {
      const mockMongoose = jest.requireMock('mongoose') as MockMongoose;
      mockMongoose.models = { Entry: 'ExistingModel' };
      
      jest.requireActual('../Entry');
      
      expect('Entry' in mockMongoose.models).toBe(false);
    });
  });
}); 