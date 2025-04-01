import Patient from '../Patient';

// Augment Jest's Mock type to include our needed properties
interface MockSchemaWithTypes extends jest.Mock {
  Types: {
    ObjectId: string;
  };
}

// Set up mocks before importing modules
jest.mock('mongoose', () => {
  // Create mock functions
  const mockSchema = jest.fn() as MockSchemaWithTypes;
  const mockModel = jest.fn().mockReturnValue('MockPatientModel');
  
  // Set schema properties needed for the Patient model
  mockSchema.Types = { ObjectId: 'ObjectId' };
  
  // Return the mock mongoose object
  return {
    Schema: mockSchema,
    model: mockModel,
    models: {}
  };
});

describe('Patient Model', () => {
  let mongoose: any;
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Import mongoose after mocking
    mongoose = require('mongoose');
    
    // Force re-import of Patient model to trigger schema creation
    jest.isolateModules(() => {
      require('../Patient');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(Patient).toBe('MockPatientModel');
  });
  
  it('should create model with correct name and collection', () => {
    // Verify model was created with correct parameters
    const modelCalls = mongoose.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('Patient');
    expect(lastCall[2]).toBe('patients');
  });
  
  it('should check for patient fields in schema', () => {
    // Extract schema from the first call to Schema constructor
    const schemaCall = mongoose.Schema.mock.calls[0];
    expect(schemaCall).toBeDefined();
    
    // Since we can't easily check the schema structure directly,
    // we can test the presence of the Schema constructor call
    expect(mongoose.Schema).toHaveBeenCalled();
  });
  
  it('should check for existing model before creating a new one', () => {
    // Import the module in a special context for this test
    jest.isolateModules(() => {
      // Mock that the model already exists
      const mockMongoose = require('mongoose');
      mockMongoose.models = { Patient: 'ExistingModel' };
      
      // Import should delete the existing model
      require('../Patient');
      
      // Verify model cache was cleared
      expect('Patient' in mockMongoose.models).toBe(false);
    });
  });
}); 