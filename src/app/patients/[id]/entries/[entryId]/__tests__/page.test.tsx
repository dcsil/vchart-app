import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntryDetails from '../page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/app/utils/log', () => ({
  log: jest.fn(),
}));

jest.mock('jspdf', () => ({
  jsPDF: jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    line: jest.fn(),
    addPage: jest.fn(),
    save: jest.fn(),
  })),
}));

global.fetch = jest.fn();

import { useRouter, useParams } from 'next/navigation';
import { log } from '@/app/utils/log';

describe('Entry Details Page', () => {
  const mockPatient = {
    _id: '123',
    firstName: 'John',
    lastName: 'Doe',
    roomNumber: '101',
    diagnosis: 'Flu'
  };
  
  const mockEntry = {
    _id: 'entry1',
    patientId: '123',
    temperature: '98.6',
    bloodPressure: '120/80',
    pulseRate: '72',
    respiratoryRate: '16',
    oxygenSaturation: '98',
    painLevel: '2',
    reviewed: false,
    createdAt: '2023-04-01T12:00:00Z'
  };
  
  const mockBack = jest.fn();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
      refresh: mockRefresh
    });
    
    // Mock params
    (useParams as jest.Mock).mockReturnValue({
      id: '123',
      entryId: 'entry1'
    });
  });
  
  it('should render basic page elements', () => {
    // Mock both API calls to return successfully right away
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    render(<EntryDetails />);
    
    expect(screen.getByText(/Back to Entry List/i)).toBeInTheDocument();
  });
  
  it('should call back function when back button is clicked', () => {
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    );
    
    render(<EntryDetails />);
    
    const backButton = screen.getByText(/Back to Entry List/i);
    fireEvent.click(backButton);
    
    expect(mockBack).toHaveBeenCalled();
  });
  
  it('should load and display form with entry data when available', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entry: mockEntry })
      })
    );
    
    render(<EntryDetails />);
    
    await waitFor(() => {
    const temperatureInput = screen.getByLabelText(/Temperature/i);
    expect(temperatureInput).toHaveValue('98.6');
    });
  });
  
  it('should be able to modify form inputs', async () => {
    // Mock successful patient and entry fetches
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entry: mockEntry })
      })
    );
    
    render(<EntryDetails />);
    
    // Wait for form to load
    await waitFor(() => {
      const temperatureInput = screen.getByLabelText(/Temperature/i);
      // Update temperature field
      fireEvent.change(temperatureInput, { target: { value: '99.1' } });
      expect(temperatureInput).toHaveValue('99.1');
    });
  });

  it('should display error message when patient fetch fails', async () => {
    // Mock failed patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Patient not found' })
      })
    );
    
    render(<EntryDetails />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Could not load entry details/i)).toBeInTheDocument();
    });
    
    // Verify error was logged
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Error fetching details'), 'error');
  });
  
  it('should display error message when entry fetch fails', async () => {
    // Mock successful patient fetch but failed entry fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Entry not found' })
      })
    );
    
    render(<EntryDetails />);
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Could not load entry details/i)).toBeInTheDocument();
      expect(screen.getByText(/Entry not found/i)).toBeInTheDocument();
    });
    
    // Verify error was logged
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Error fetching details'), 'error');
  });
  
  it('should handle network errors during fetch', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<EntryDetails />);
    
    await waitFor(() => {
      expect(screen.getByText(/Could not load entry details/i)).toBeInTheDocument();
    });
    
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Error fetching details'), 'error');
  });
  
  it('should have a review button when entry data is loaded', async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    // Mock successful entry fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entry: mockEntry })
      })
    );
    
    render(<EntryDetails />);
    
    await waitFor(() => {
      const reviewButton = screen.getByText(/Mark as/i).closest('button');
      expect(reviewButton).toBeInTheDocument();
    });
  });
  
  it('should have an export button when entry data is loaded', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient })
      })
    );
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entry: mockEntry })
      })
    );
    
    render(<EntryDetails />);
    
    await waitFor(() => {
      const exportButton = screen.getByText(/Export/i);
      expect(exportButton).toBeInTheDocument();
    });
  });
}); 