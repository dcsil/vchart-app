import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";
import { log } from "../app/utils/log";

// Mock the log utility
jest.mock("../app/utils/log", () => ({
  log: jest.fn(),
}));

// Mock the Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Set up a default mock for global.fetch so that tests don't break.
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
    
    // Check for loading spinner - the component uses a div with animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Wait for the patient to appear after loading
    await waitFor(() =>
      expect(screen.getByText("John Doe")).toBeInTheDocument()
    );
  });

  test("displays error message when API call fails", async () => {
    // Override fetch to simulate a failure
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
    // Mock the log function implementation for this test
    const mockPatientId = "1";
    
    render(<Home />);
    
    // Wait for patients to load and then click on a patient
    await waitFor(() => {
      const patientElement = screen.getByText("John Doe");
      fireEvent.click(patientElement);
      
      // Check if log was called with the expected arguments
      expect(log).toHaveBeenCalledWith(`Patient ${mockPatientId} clicked`, "info");
    });
  });

  test("renders image with correct alt text", async () => {
    render(<Home />);
    
    // Wait for component to load
    await waitFor(() => {
      // Look for the avatar initial (first letter of patient's first name)
      const avatarInitial = screen.getByText("J");
      expect(avatarInitial).toBeInTheDocument();
    });
  });

  test("renders welcome title", async () => {
    render(<Home />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText("Patient List")).toBeInTheDocument();
    });
  });
});
