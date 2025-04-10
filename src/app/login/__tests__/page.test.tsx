import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Login from "../page";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("Login Page", () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    global.fetch = jest.fn();
  });

  it("renders the login form correctly", () => {
    render(<Login />);

    expect(screen.getByText("Welcome to VChart")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("updates input values when user types", () => {
    render(<Login />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    fireEvent.change(usernameInput, { target: { value: "testuser" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("password123");
  });

  it("successfully submits on login", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Login successful" }),
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "nurseuser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "nursepass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(
      screen.getByRole("button", { name: "Signing In..." })
    ).toBeDisabled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "nurseuser", password: "nursepass" }),
      });
    });

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows an error message when login fails", async () => {
    const errorMessage = "Invalid credentials";

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: errorMessage }),
    });

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "wronguser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeEnabled();
  });

  it("handles fetch errors gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network Error")
    );

    render(<Login />);

    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Network Error")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
