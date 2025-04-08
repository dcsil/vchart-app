"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  username: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<{
    username: string;
    password: string;
    role: string;
  }>({
    username: "",
    password: "",
    role: "nurse",
  });
  const [message, setMessage] = useState<string>("");
  // For tracking inline password edits per user
  const [editPasswords, setEditPasswords] = useState<Record<string, string>>(
    {}
  );

  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) {
        setForm({ username: "", password: "", role: "nurse" });
        fetchUsers();
      }
    } catch (err) {
      console.error("Error creating user:", err);
    }
  };

  // DELETE a user account
  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // For editing user password inline
  const handleEditPasswordChange = (userId: string, newPassword: string) => {
    setEditPasswords((prev) => ({ ...prev, [userId]: newPassword }));
  };

  // Submit updated password for a user
  const handleUpdatePassword = async (userId: string) => {
    const newPassword = editPasswords[userId];
    if (!newPassword) {
      setMessage("Please enter a new password.");
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      setMessage(data.message);
      if (res.ok) {
        // Clear the editing password field
        setEditPasswords((prev) => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
        fetchUsers();
      }
    } catch (err) {
      console.error("Error updating password:", err);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to login page
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Navbar Integration */}
      <Navbar />

      {/* Logout Button (Top Right) */}
      <div className="absolute top-2 right-4 z-10">
        <button
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Logout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Manage Users</h1>
        {message && <p className="mb-4 text-green-600">{message}</p>}

        <form onSubmit={handleSubmit} className="mb-8">
          <div>
            <label>Username: </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label>Password: </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label>Role: </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="border p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="nurse">Nurse</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Create User
          </button>
        </form>

        <h2 className="text-xl font-semibold mb-2">Existing Users</h2>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Username</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="border px-2 py-1">{user._id}</td>
                <td className="border px-2 py-1">{user.username}</td>
                <td className="border px-2 py-1">{user.role}</td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="mr-2 px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Delete
                  </button>
                  {editPasswords.hasOwnProperty(user._id) ? (
                    <>
                      <input
                        type="password"
                        placeholder="New Password"
                        value={editPasswords[user._id]}
                        onChange={(e) =>
                          handleEditPasswordChange(user._id, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleUpdatePassword(user._id)}
                        className="ml-2 px-2 py-1 bg-green-500 text-white rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() =>
                          setEditPasswords((prev) => {
                            const newState = { ...prev };
                            delete newState[user._id];
                            return newState;
                          })
                        }
                        className="ml-2 px-2 py-1 bg-gray-500 text-white rounded"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() =>
                        setEditPasswords((prev) => ({
                          ...prev,
                          [user._id]: "",
                        }))
                      }
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
