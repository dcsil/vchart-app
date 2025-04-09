import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminUsersPage from "../page";
import { useRouter } from "next/navigation";

// Mock next/navigation to control router behavior.
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Create router mocks.
const pushMock = jest.fn();
const refreshMock = jest.fn();

beforeEach(() => {
  // Reset router mocks.
  pushMock.mockReset();
  refreshMock.mockReset();
  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
    refresh: refreshMock,
  });

  // Reset global fetch mock.
  global.fetch = jest.fn();

  // Reset window.confirm mock.
  window.confirm = jest.fn();
});

describe("AdminUsersPage", () => {
  test("fetches and displays users on mount", async () => {
    // Simulate GET /api/admin/users response.
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ _id: "user1", username: "admin", role: "admin" }],
      }),
    });

    render(<AdminUsersPage />);

    // Wait until at least one element with "admin" appears.
    await waitFor(() => {
      expect(screen.getAllByText("admin").length).toBeGreaterThan(0);
    });
  });

  test("submits form and creates a new user", async () => {
    // Setup:
    // 1) GET returns no users.
    // 2) POST returns success.
    // 3) GET refresh returns a new user list.
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: "User created successfully" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ _id: "user2", username: "newuser", role: "nurse" }],
        }),
      });

    const { container } = render(<AdminUsersPage />);

    // Wait for the initial GET to be called.
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    const usernameInput = container.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;
    const passwordInput = container.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;
    const roleSelect = container.querySelector(
      'select[name="role"]'
    ) as HTMLSelectElement;

    // Simulate form changes.
    fireEvent.change(usernameInput, { target: { value: "newuser" } });
    fireEvent.change(passwordInput, { target: { value: "testpass" } });
    fireEvent.change(roleSelect, { target: { value: "nurse" } });

    // Submit the form.
    const submitButton = screen.getByRole("button", {
      name: /create user/i,
    });
    fireEvent.click(submitButton);

    // Wait for the success message.
    await waitFor(() => {
      expect(screen.getByText("User created successfully")).toBeInTheDocument();
    });

    // Verify that the form was reset (check that the username input is now empty).
    expect(usernameInput).toHaveValue("");
  });

  test("deletes a user when delete button is clicked", async () => {
    // Setup:
    // 1) GET returns one user.
    // 2) DELETE call returns success.
    // 3) GET refresh returns an empty list.
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ _id: "user1", username: "user1", role: "nurse" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "User deleted successfully",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      });

    // Simulate confirmation of deletion.
    (window.confirm as jest.Mock).mockReturnValue(true);

    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getAllByText("user1").length).toBeGreaterThan(0);
    });

    // Click the delete button.
    const deleteButton = screen.getByRole("button", {
      name: /delete/i,
    });
    fireEvent.click(deleteButton);

    // Wait for the success message.
    await waitFor(() => {
      expect(screen.getByText("User deleted successfully")).toBeInTheDocument();
    });
  });

  test("updates user password inline", async () => {
    // Setup:
    // 1) GET returns one user.
    // 2) PUT call to update password returns success.
    // 3) GET refresh returns the same user list.
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ _id: "user1", username: "user1", role: "nurse" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "User updated successfully",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ _id: "user1", username: "user1", role: "nurse" }],
        }),
      });

    render(<AdminUsersPage />);
    await waitFor(() => {
      expect(screen.getAllByText("user1").length).toBeGreaterThan(0);
    });

    // Click the "Edit Password" button.
    const editPasswordButton = screen.getByRole("button", {
      name: /edit password/i,
    });
    fireEvent.click(editPasswordButton);

    // Change the inline password.
    const passwordInput = screen.getByPlaceholderText("New Password");
    fireEvent.change(passwordInput, {
      target: { value: "newpass123" },
    });

    // Click the "Save" button.
    const saveButton = screen.getByRole("button", { name: /save/i });
    fireEvent.click(saveButton);

    // Wait for the success message.
    await waitFor(() => {
      expect(screen.getByText("User updated successfully")).toBeInTheDocument();
    });
  });

  test("cancels inline password edit", async () => {
    // Setup initial GET response.
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        users: [{ _id: "user1", username: "user1", role: "nurse" }],
      }),
    });

    render(<AdminUsersPage />);
    // Ensure at least one element with "user1" appears.
    await waitFor(() => {
      expect(screen.getAllByText("user1").length).toBeGreaterThan(0);
    });

    // Click "Edit Password" to reveal the inline editor.
    const editPasswordButton = screen.getByRole("button", {
      name: /edit password/i,
    });
    fireEvent.click(editPasswordButton);

    // The inline editor should now be visible (check for Cancel button).
    const cancelButton = screen.getByRole("button", {
      name: /cancel/i,
    });
    expect(cancelButton).toBeInTheDocument();

    // Click the "Cancel" button.
    fireEvent.click(cancelButton);

    // Wait until the inline editor is removed.
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /cancel/i })).toBeNull();
    });
  });

  test("handles logout", async () => {
    // Setup:
    // 1) GET returns an empty user list.
    // 2) POST to /api/auth/logout returns ok.
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ users: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(<AdminUsersPage />);

    const logoutButton = screen.getByRole("button", {
      name: /logout/i,
    });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
