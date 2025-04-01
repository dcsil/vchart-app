import Entry from '../Entry';

interface MockSchemaWithTypes extends jest.Mock {
  Types: {
    ObjectId: string;
  };
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
  let mongoose: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mongoose = require('mongoose');
    
    jest.isolateModules(() => {
      require('../Entry');
    });
  });
  
  it('should export a mongoose model', () => {
    expect(Entry).toBe('MockEntryModel');
  });
  
  it('should create model with correct name and collection', () => {
    const modelCalls = mongoose.model.mock.calls;
    expect(modelCalls.length).toBeGreaterThan(0);
    
    const lastCall = modelCalls[modelCalls.length - 1];
    expect(lastCall[0]).toBe('Entry');
    expect(lastCall[2]).toBe('entries');
  });
  
  it('should check for existing model before creating a new one', () => {
    jest.isolateModules(() => {
      const mockMongoose = require('mongoose');
      mockMongoose.models = { Entry: 'ExistingModel' };
      
      require('../Entry');
      
      expect('Entry' in mockMongoose.models).toBe(false);
    });
  });
}); 