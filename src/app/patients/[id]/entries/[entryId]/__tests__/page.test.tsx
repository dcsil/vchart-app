import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EntryDetails from "../page";
import { useRouter, useParams } from "next/navigation";

// Mock the Next.js navigation hooks.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// -------------------------------------------------------------------------
// Dummy Data
// -------------------------------------------------------------------------
const dummyPatient = {
  _id: "p1",
  firstName: "John",
  lastName: "Doe",
  roomNumber: "101",
  diagnosis:
    "Test diagnosis is long enough to require wrapping in the export PDF.",
};

const dummyEntry = {
  _id: "e1",
  patientId: "p1",
  vitalSigns: {
    temperature: { value: "36", unit: "C" },
    bloodPressure: { systolic: "120", diastolic: "80", unit: "mmHg" },
    heartRate: "70",
    respiratoryRate: "16",
    oxygenSaturation: "98",
  },
  subjective: {
    chiefComplaint: "Headache",
    symptomHistory: "Mild headache for two days.",
    painLevel: "5",
  },
  objective: {
    generalAppearance: "Normal",
    cardiovascular: "Regular rhythm",
    respiratory: "Clear lung sounds",
    neurological: "Alert and oriented",
    skin: "Warm and dry",
    additionalExam: "No additional findings",
  },
  assessment: "No significant findings",
  plan: "Observation and rest",
  reviewed: false, // Start as unreviewed
  createdAt: "2022-10-10T12:00:00Z",
};

// -------------------------------------------------------------------------
// Test Suite
// -------------------------------------------------------------------------
describe("EntryDetails page", () => {
  beforeEach(() => {
    // Set default URL parameters.
    (useParams as jest.Mock).mockReturnValue({ id: "p1", entryId: "e1" });
    // Provide a default router with a back method.
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("renders loading spinner and then displays entry details", async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url.includes("/api/patients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ patient: dummyPatient }),
        });
      }
      if (url.includes("/api/entries")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entry: dummyEntry }),
        });
      }
      return Promise.reject("Unknown endpoint");
    });

    render(<EntryDetails />);

    // Verify that the loading spinner (or equivalent element) is displayed initially.
    expect(document.querySelector(".animate-spin")).toBeTruthy();

    // Wait for the "Temperature" input (a reliable field) to appear.
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    // Verify that the page heading indicates the entry is unreviewed.
    expect(screen.getByText(/EMR Entry\s*\(Unreviewed\)/i)).toBeInTheDocument();
  });

  test("displays an error message when patient fetch fails", async () => {
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url.includes("/api/patients")) {
        return Promise.resolve({ ok: false });
      }
      if (url.includes("/api/entries")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entry: dummyEntry }),
        });
      }
      return Promise.reject("Unknown endpoint");
    });

    render(<EntryDetails />);

    await waitFor(() => {
      expect(
        screen.getByText(/Could not load entry details/i)
      ).toBeInTheDocument();
    });
  });

  test("updates the entry when Mark as Reviewed button is clicked", async () => {
    let entryData = { ...dummyEntry };
    (global.fetch as jest.Mock) = jest.fn((url: string, options?: any) => {
      if (url.includes("/api/patients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ patient: dummyPatient }),
        });
      }
      if (
        url.includes("/api/entries") &&
        (!options || options.method === "GET")
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entry: entryData }),
        });
      }
      if (url.includes("/api/entries") && options?.method === "PUT") {
        entryData = { ...entryData, reviewed: !entryData.reviewed };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
      return Promise.reject("Unknown endpoint");
    });

    render(<EntryDetails />);

    // Wait for a known input to appear.
    await waitFor(() => {
      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
    });

    // Initially, the export button should be disabled.
    const exportButton = screen.getByRole("button", { name: /^Export$/i });
    expect(exportButton).toBeDisabled();

    // Find and click the toggle review button.
    const buttons = screen.getAllByRole("button");
    const toggleButton = buttons.find(
      (btn) => btn.textContent && btn.textContent.includes("Mark as")
    );
    expect(toggleButton).toBeDefined();
    fireEvent.click(toggleButton!);

    // Wait for the entry state to update.
    await waitFor(() => {
      expect(screen.getByText(/EMR Entry\s*\(Reviewed\)/i)).toBeInTheDocument();
    });

    // Now, the export button should become enabled.
    expect(exportButton).not.toBeDisabled();
  });

  test("the back button calls router.back", async () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
    });
    (global.fetch as jest.Mock) = jest.fn((url: string) => {
      if (url.includes("/api/patients")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ patient: dummyPatient }),
        });
      }
      if (url.includes("/api/entries")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entry: dummyEntry }),
        });
      }
      return Promise.reject("Unknown endpoint");
    });

    render(<EntryDetails />);
    await waitFor(() => {
      expect(screen.getByText(/EMR Entry/i)).toBeInTheDocument();
    });
    const backButton = screen.getByRole("button", {
      name: /Back to Entry List/i,
    });
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });
});
