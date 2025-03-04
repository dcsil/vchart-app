import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Home from "../app/page";
import { log } from "../app/utils/log";

// Mock the log utility
jest.mock("../app/utils/log", () => ({
  log: jest.fn(),
}));

// Set up a default mock for global.fetch so that tests don't break.
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ message: "Hello from API" }),
    })
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Home Component", () => {
  test("renders loading message and updates with API response", async () => {
    render(<Home />);
    // Initially shows the loading message
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for the API response to update the component
    await waitFor(() =>
      expect(screen.getByText("Hello from API")).toBeInTheDocument()
    );
  });

  test("displays error message when API call fails", async () => {
    // Override fetch to simulate a failure
    global.fetch.mockImplementationOnce(() =>
      Promise.reject(new Error("API error"))
    );

    render(<Home />);
    // Check initial loading state
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    // Wait for the error message to appear
    await waitFor(() =>
      expect(screen.getByText("Error fetching data")).toBeInTheDocument()
    );
  });

  test("calls log function when log buttons are clicked", () => {
    render(<Home />);

    const debugButton = screen.getByRole("button", { name: /debug/i });
    const infoButton = screen.getByRole("button", { name: /info/i });
    const warnButton = screen.getByRole("button", { name: /warn/i });
    const errorButton = screen.getByRole("button", { name: /error/i });

    fireEvent.click(debugButton);
    expect(log).toHaveBeenCalledWith("Debug button pressed", "debug");

    fireEvent.click(infoButton);
    expect(log).toHaveBeenCalledWith("Info button pressed", "info");

    fireEvent.click(warnButton);
    expect(log).toHaveBeenCalledWith("Warn button pressed", "warn");

    fireEvent.click(errorButton);
    expect(log).toHaveBeenCalledWith("Error button pressed", "error");
  });

  test("renders image with correct alt text", () => {
    render(<Home />);
    const image = screen.getByAltText("VChart Logo");
    expect(image).toBeInTheDocument();
  });

  test("renders welcome title", () => {
    render(<Home />);
    expect(screen.getByText("Welcome to VChart")).toBeInTheDocument();
  });
});
