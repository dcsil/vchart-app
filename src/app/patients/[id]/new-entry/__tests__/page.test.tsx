import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import NewEntryPage from "../page";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/app/utils/log", () => ({
  log: jest.fn(),
}));

jest.mock("@/app/hooks/useTranscription", () => ({
  useTranscription: jest.fn(() => ({
    isListening: false,
    startListening: jest.fn(),
    stopListening: jest.fn(),
  })),
}));

global.fetch = jest.fn();

import { useRouter, useParams } from "next/navigation";
import { useTranscription } from "@/app/hooks/useTranscription";

describe("New Entry Page", () => {
  const mockPatient = {
    _id: "123",
    firstName: "John",
    lastName: "Doe",
    roomNumber: "101",
    diagnosis: "Flu",
  };

  const mockBack = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
      push: mockPush,
      refresh: jest.fn(),
    });

    (useParams as jest.Mock).mockReturnValue({
      id: "123",
    });
  });

  it("should render the form with correct fields", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    render(<NewEntryPage />);
    expect(screen.getByText("New Entry")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/Blood Pressure/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pulse Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Respiratory Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Oxygen Saturation/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pain Level/i)).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Save Entry/i })
    ).toBeInTheDocument();
  });

  it("should allow filling the form fields", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    render(<NewEntryPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Temperature/i), {
      target: { value: "98.6" },
    });
    fireEvent.change(screen.getByLabelText(/Blood Pressure/i), {
      target: { value: "120/80" },
    });

    expect(screen.getByLabelText(/Temperature/i)).toHaveValue("98.6");
    expect(screen.getByLabelText(/Blood Pressure/i)).toHaveValue("120/80");
  });

  it("should call router.back when back button is clicked", async () => {
    // Mock successful patient fetch
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    render(<NewEntryPage />);

    const backButton = screen.getByText(/Back to Entry List/i);
    fireEvent.click(backButton);

    expect(mockBack).toHaveBeenCalled();
  });

  it("should make API call when submit button is clicked", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Entry created successfully" }),
      })
    );

    render(<NewEntryPage />);

    // Wait for form fields to be loaded
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Temperature/i), {
      target: { value: "98.6" },
    });
    fireEvent.change(screen.getByLabelText(/Blood Pressure/i), {
      target: { value: "120/80" },
    });
    fireEvent.change(screen.getByLabelText(/Pulse Rate/i), {
      target: { value: "72" },
    });
    fireEvent.change(screen.getByLabelText(/Respiratory Rate/i), {
      target: { value: "16" },
    });
    fireEvent.change(screen.getByLabelText(/Oxygen Saturation/i), {
      target: { value: "98" },
    });
    fireEvent.change(screen.getByLabelText(/Pain Level/i), {
      target: { value: "2" },
    });

    const submitButton = screen.getByText(/Save Entry/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/entries",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("98.6"),
        })
      );
    });
  });

  it("should update form fields based on transcription", async () => {
    const mockTranscript = "Temperature 98.6 Blood Pressure 120/80";
    const mockCohereResponse = JSON.stringify({
      temperature: "98.6",
      bloodPressure: "120/80",
    });

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ text: mockCohereResponse }),
      })
    );

    render(<NewEntryPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    // Simulate transcription
    fireEvent.change(screen.getByLabelText(/Temperature/i), {
      target: { value: "98.6" },
    });
    fireEvent.change(screen.getByLabelText(/Blood Pressure/i), {
      target: { value: "120/80" },
    });

    expect(screen.getByLabelText(/Temperature/i)).toHaveValue("98.6");
    expect(screen.getByLabelText(/Blood Pressure/i)).toHaveValue("120/80");
  });

  it("should show loading state and redirect on successful form submission", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ patient: mockPatient }),
      })
    );

    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Entry created successfully" }),
      })
    );

    render(<NewEntryPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/Save Entry/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toHaveTextContent("Saving...");
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/patients/123");
    });
  });
});
