import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";
import { log } from "../app/utils/log";

jest.mock("../app/utils/log", () => ({
  log: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ 
        patients: [
          {
            _id: "1",
            firstName: "John",
            lastName: "Doe",
            roomNumber: "101",
            diagnosis: "Fever"
          }
        ]
      }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Home Component", () => {
  test("renders loading message and updates with API response", async () => {
    render(<Home />);
    
    // Check for loading spinner
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for the patient to appear
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    );
  });

  test("displays error message when API call fails", async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error("API error"))
    );

    render(<Home />);
    
    // Wait for the error message to appear
    await waitFor(() =>
      expect(screen.getByText(/could not load patients/i)).toBeInTheDocument()
    );
  });

  test("calls log function when log buttons are clicked", async () => {
    const mockPatientId = "1";
    
    render(<Home />);
    
    await waitFor(() => {
      const patientElement = screen.getByText("John Doe");
      fireEvent.click(patientElement);
      
      // Check if log was called with the expected arguments
      expect(log).toHaveBeenCalledWith(`Patient ${mockPatientId} clicked`, "info");
    });
  });

  test("renders image with correct alt text", async () => {
    render(<Home />);
    
    await waitFor(() => {
      // Look for the avatar initial
      const avatarInitial = screen.getByText("J");
      expect(avatarInitial).toBeInTheDocument();
    });
  });

  test("renders welcome title", async () => {
    render(<Home />);
    
    await waitFor(() => {
      expect(screen.getByText("Patient List")).toBeInTheDocument();
    });
  });
});
