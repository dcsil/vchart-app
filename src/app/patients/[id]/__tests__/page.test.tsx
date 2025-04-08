import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import PatientDetails from "../page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/app/utils/log", () => ({
  log: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

import { useRouter, useParams } from "next/navigation";

describe("Patient Details Page", () => {
  // Mock data
  const mockPatient = {
    _id: "123",
    firstName: "John",
    lastName: "Doe",
    roomNumber: "101",
    diagnosis: "Flu",
  };

  const mockEntries = [
    {
      _id: "entry1",
      patientId: "123",
      temperature: "98.6",
      bloodPressure: "120/80",
      pulseRate: "72",
      respiratoryRate: "16",
      oxygenSaturation: "98",
      painLevel: "2",
      reviewed: false,
      createdAt: "2023-04-01T12:00:00Z",
    },
  ];

  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock router functions
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
    });

    // Mock params
    (useParams as jest.Mock).mockReturnValue({
      id: "123",
    });
  });

  it("should render loading indicator initially", () => {
    // Mock fetch to delay response
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<PatientDetails />);

    // Check for loading spinner (using the class instead of role)
    const loadingSpinner = document.querySelector(".animate-spin");
    expect(loadingSpinner).toBeInTheDocument();
  });

  it("should load and display patient details", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    // Mock successful entries fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entries: mockEntries }),
      })
    );

    render(<PatientDetails />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    // Check patient info is displayed
    expect(screen.getByText(/Room:/i)).toBeInTheDocument();
    expect(screen.getByText(/101/i)).toBeInTheDocument();
    expect(screen.getByText(/Diagnosis:/i)).toBeInTheDocument();
    expect(screen.getByText(/Flu/i)).toBeInTheDocument();
  });

  it("should navigate back when back button is clicked", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    // Mock successful entries fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entries: mockEntries }),
      })
    );

    render(<PatientDetails />);

    // Click back button
    fireEvent.click(screen.getByText(/Back to Patient List/i));
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("should navigate to new entry page when new entry button is clicked", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entries: mockEntries }),
      })
    );

    render(<PatientDetails />);

    await waitFor(() => {
      expect(screen.getByText(/New Entry/i)).toBeInTheDocument();
    });

    // Click new entry button
    fireEvent.click(screen.getByText(/New Entry/i));
    expect(mockPush).toHaveBeenCalledWith("/patients/123/new-entry");
  });

  it("should display entries with timestamp", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ entries: mockEntries }),
      })
    );

    render(<PatientDetails />);

    await waitFor(() => {
      expect(screen.getByText(/History/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Apr 1, 2023/)).toBeInTheDocument();
    expect(screen.getByText(/Pending Review/i)).toBeInTheDocument();

    // Check view button is present (using role + class combination to be more specific)
    const viewButton = screen.getByRole("button", { name: /View/i });
    expect(viewButton).toBeInTheDocument();
    expect(viewButton).toHaveClass("bg-[#8B52FF]");
  });
});
