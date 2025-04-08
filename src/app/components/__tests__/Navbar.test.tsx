import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

(useRouter as jest.Mock).mockReturnValue({
  push: mockPush,
  refresh: mockRefresh,
});

beforeEach(() => {
  Object.defineProperty(document, "cookie", {
    writable: true,
    value: "",
  });
  jest.clearAllMocks();
});

describe("Navbar component", () => {
  it("renders app name correctly", () => {
    render(<Navbar />);

    expect(screen.getByText("VChart App")).toBeInTheDocument();
  });

  it("does not show welcome message or logout button if not logged in", () => {
    render(<Navbar />);

    expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Logout/i })
    ).not.toBeInTheDocument();
  });

  it("shows username and role from cookie if logged in", async () => {
    const sessionData = { username: "testuser", role: "nurse" };
    document.cookie = `auth-session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}`;

    render(<Navbar />);

    await waitFor(() => {
      expect(screen.getByText("Welcome, testuser (nurse)")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Logout/i })
      ).toBeInTheDocument();
    });
  });

  it("logs out user correctly and redirects to login", async () => {
    const sessionData = { username: "testuser", role: "nurse" };
    document.cookie = `auth-session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}`;

    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    render(<Navbar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Logout/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/logout",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
      expect(mockPush).toHaveBeenCalledWith("/login");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("handles logout errors gracefully", async () => {
    const sessionData = { username: "testuser", role: "nurse" };
    document.cookie = `auth-session=${encodeURIComponent(
      JSON.stringify(sessionData)
    )}`;

    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    render(<Navbar />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Logout/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Logout/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});
