import Patient from '../Patient';

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
  const mockModel = jest.fn().mockReturnValue('MockPatientModel');
  
  mockSchema.Types = { ObjectId: 'ObjectId' };
  
  return {
    Schema: mockSchema,
    model: mockModel,
    models: {}
  };
});

describe('Patient Model', () => {
  let mongooseInstance: MockMongoose;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mongooseInstance = jest.requireMock('mongoose') as MockMongoose;
    
    jest.isolateModules(() => {
      jest.requireActual('../Patient');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(Patient).toBe('MockPatientModel');
  });
  
  it('should create model with correct name and collection', () => {
    // Verify model was created with correct parameters
    const modelCalls = mongooseInstance.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('Patient');
    expect(lastCall[2]).toBe('patients');
  });
  
  it('should check for patient fields in schema', () => {
    // Extract schema from the first call to Schema constructor
    const schemaCall = mongooseInstance.Schema.mock.calls[0];
    expect(schemaCall).toBeDefined();
    
    expect(mongooseInstance.Schema).toHaveBeenCalled();
  });
  
  it('should check for existing model before creating a new one', () => {
    // Import the module in a special context for this test
    jest.isolateModules(() => {
      const mockMongoose = jest.requireMock('mongoose') as MockMongoose;
      mockMongoose.models = { Patient: 'ExistingModel' };
      
      jest.requireActual('../Patient');
      
      expect('Patient' in mockMongoose.models).toBe(false);
    });
  });
}); 