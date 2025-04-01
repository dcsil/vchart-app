import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewEntryPage from '../page';

// Mock Next.js router and modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock logging utility
jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

// Import mocked modules
import { useRouter, useParams } from 'next/navigation';
import { log } from '@/app/utils/log';

describe('New Entry Page', () => {
  // Mock data
  const mockPatient = {
    _id: '123',
    firstName: 'John',
    lastName: 'Doe',
    roomNumber: '101',
    diagnosis: 'Flu'
  };
  
  // Set up mock router and params
  const mockBack = jest.fn();
  const mockPush = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router functions
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
      refresh: jest.fn()
    });
    
    // Mock params
    (useParams as jest.Mock).mockReturnValue({
      id: '123'
    });
  });
  
  it('should render the form with correct fields', async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    render(<NewEntryPage />);
    
    // Check for basic page elements
    expect(screen.getByText('New Entry')).toBeInTheDocument();
    
    // Wait for form fields to be loaded
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });
    
    // Check that form fields are present
    expect(screen.getByLabelText(/Blood Pressure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pulse Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Respiratory Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Oxygen Saturation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pain Level/i)).toBeInTheDocument();
    
    // Check for submit button
    expect(screen.getByRole('button', { name: /Save Entry/i })).toBeInTheDocument();
  });
  
  it('should allow filling the form fields', async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    render(<NewEntryPage />);
    
    // Wait for form fields to be loaded
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Temperature/i), { target: { value: '98.6' } });
    fireEvent.change(screen.getByLabelText(/Blood Pressure/i), { target: { value: '120/80' } });
    
    // Check values are entered
    expect(screen.getByLabelText(/Temperature/i)).toHaveValue('98.6');
    expect(screen.getByLabelText(/Blood Pressure/i)).toHaveValue('120/80');
  });
  
  it('should call router.back when back button is clicked', async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    render(<NewEntryPage />);
    
    // Find and click the back button
    const backButton = screen.getByText(/Back to Entry List/i);
    fireEvent.click(backButton);
    
    // Verify router.back was called
    expect(mockBack).toHaveBeenCalled();
  });
  
  it('should make API call when submit button is clicked', async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    // Mock successful POST request
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Entry created successfully' })
      })
    );
    
    render(<NewEntryPage />);
    
    // Wait for form fields to be loaded
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Temperature/i), { target: { value: '98.6' } });
    fireEvent.change(screen.getByLabelText(/Blood Pressure/i), { target: { value: '120/80' } });
    fireEvent.change(screen.getByLabelText(/Pulse Rate/i), { target: { value: '72' } });
    fireEvent.change(screen.getByLabelText(/Respiratory Rate/i), { target: { value: '16' } });
    fireEvent.change(screen.getByLabelText(/Oxygen Saturation/i), { target: { value: '98' } });
    fireEvent.change(screen.getByLabelText(/Pain Level/i), { target: { value: '2' } });
    
    // Submit the form using the submit button
    const submitButton = screen.getByText(/Save Entry/i);
    fireEvent.click(submitButton);
    
    // Wait for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/entries', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('98.6')
      }));
    });
  });
}); 