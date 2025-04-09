import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewEntry from "../page"; // Adjust the path as needed
import { useRouter, useParams } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

// Mock the transcription hook to disable real listening and transcript updates
jest.mock("@/app/hooks/useTranscription", () => ({
  useTranscription: () => ({
    isListening: false,
    transcript: "",
    interimResult: "",
    startListening: jest.fn(),
    stopListening: jest.fn(),
  }),
}));

describe("NewEntry Page", () => {
  const mockPush = jest.fn();
  const mockBack = jest.fn();

  beforeEach(() => {
    // Provide dummy implementations for next/navigation hooks
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    (useParams as jest.Mock).mockReturnValue({
      id: "patient123",
    });
    jest.clearAllMocks();
  });

  test("renders the New EMR Entry page", () => {
    render(<NewEntry />);
    expect(screen.getByText("New EMR Entry")).toBeInTheDocument();
    expect(screen.getByLabelText("Temperature")).toBeInTheDocument();
    // You can add additional expectations for other fields here.
  });

  test("calls router.back on clicking Back button", () => {
    render(<NewEntry />);
    const backButton = screen.getByRole("button", {
      name: /Back to Entry List/i,
    });
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();
  });

  test("submits the form and navigates after saving entry", async () => {
    // Mock global.fetch for the POST request in handleSubmit
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<NewEntry />);

    // Fill in the form fields

    // Vital Signs
    const temperatureInput = screen.getByLabelText("Temperature");
    fireEvent.change(temperatureInput, { target: { value: "37.0" } });
    const bpSystolic = screen.getByPlaceholderText("Systolic");
    const bpDiastolic = screen.getByPlaceholderText("Diastolic");
    fireEvent.change(bpSystolic, { target: { value: "120" } });
    fireEvent.change(bpDiastolic, { target: { value: "80" } });
    const heartRateInput = screen.getByLabelText("Heart Rate (BPM)");
    fireEvent.change(heartRateInput, { target: { value: "70" } });
    const respiratoryRateInput = screen.getByLabelText("Respiratory Rate");
    fireEvent.change(respiratoryRateInput, { target: { value: "16" } });
    const oxygenSaturationInput = screen.getByLabelText(
      "Oxygen Saturation (%)"
    );
    fireEvent.change(oxygenSaturationInput, { target: { value: "98" } });

    // Subjective Section
    const chiefComplaintInput = screen.getByLabelText("Chief Complaint");
    fireEvent.change(chiefComplaintInput, { target: { value: "Headache" } });
    const symptomHistoryInput = screen.getByLabelText("Symptom History");
    fireEvent.change(symptomHistoryInput, {
      target: { value: "Started 2 hours ago" },
    });
    const painLevelInput = screen.getByLabelText("Pain Level (0-10)");
    fireEvent.change(painLevelInput, { target: { value: "4" } });

    // Objective Section
    const generalAppearanceInput = screen.getByLabelText("General Appearance");
    fireEvent.change(generalAppearanceInput, {
      target: { value: "Alert and oriented" },
    });
    const cardiovascularInput = screen.getByLabelText("Cardiovascular Exam");
    fireEvent.change(cardiovascularInput, {
      target: { value: "Normal rhythm" },
    });
    const respiratoryExamInput = screen.getByLabelText("Respiratory Exam");
    fireEvent.change(respiratoryExamInput, {
      target: { value: "Clear to auscultation" },
    });
    const neurologicalInput = screen.getByLabelText("Neurological Exam");
    fireEvent.change(neurologicalInput, { target: { value: "Oriented x3" } });
    const skinInput = screen.getByLabelText("Skin Exam");
    fireEvent.change(skinInput, { target: { value: "No lesions" } });
    const additionalExamInput = screen.getByLabelText("Additional Exam");
    fireEvent.change(additionalExamInput, { target: { value: "None" } });

    // Assessment & Plan Section
    const assessmentInput = screen.getByLabelText("Assessment");
    fireEvent.change(assessmentInput, { target: { value: "Patient stable" } });
    const planInput = screen.getByLabelText("Plan");
    fireEvent.change(planInput, { target: { value: "Continue monitoring" } });

    // Simulate form submission
    const submitButton = screen.getByRole("button", { name: /Save Entry/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Wait for navigation after submission
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/patients/patient123`);
    });
  });
});
