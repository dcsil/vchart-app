import * as Sentry from '@sentry/nextjs';
import { onRequestError } from '../instrumentation';

jest.mock('@sentry/nextjs', () => ({
  captureRequestError: jest.fn()
}));

describe('Instrumentation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export onRequestError function that calls Sentry.captureRequestError', () => {
    expect(onRequestError).toBe(Sentry.captureRequestError);
    expect(Sentry.captureRequestError).toBeDefined();
  });
}); 