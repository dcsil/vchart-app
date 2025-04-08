import { NextRequest, NextResponse } from "next/server";
import { PUT, DELETE } from "../route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { log } from "@/app/utils/log";

process.env.MONGODB_URI = "mongodb://localhost:27017/test";

// Mock the dependencies so that they don't invoke real database or logging behavior.
jest.mock("@/lib/mongodb", () => {
  return jest.fn(() => Promise.resolve({})); // returns a dummy connection object
});
jest.mock("@/lib/models/User");
jest.mock("@/app/utils/log");

describe("Admin Users API Endpoints", () => {
  // Before each test, clear mocks and override NextResponse.json for easier inspection.
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(NextResponse, "json").mockImplementation(((
      body: unknown,
      init?: ResponseInit
    ) => {
      const status = init?.status ?? 200;
      return { body, status } as unknown as NextResponse;
    }) as typeof NextResponse.json);
  });

  // Tests for the PUT endpoint
  describe("PUT", () => {
    it("should return 401 (Unauthorized) if auth-session cookie is missing", async () => {
      const req = {
        cookies: { get: jest.fn().mockReturnValue(null) },
        json: jest.fn(), // stub (not used in this branch)
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      const res = await PUT(req, context);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Unauthorized" });
    });

    it("should return 403 (Forbidden) if session role is not admin", async () => {
      const session = { role: "user" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn(), // stub (not used in this branch)
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      const res = await PUT(req, context);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should update user and return 200 when successful", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "newUsername",
          password: "newPassword",
          role: "user",
        }),
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      // Simulate successful DB connection
      (connectToDatabase as jest.Mock).mockResolvedValue({});
      // Simulate that User.findByIdAndUpdate returns an updated user object.
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: "userId123",
        username: "newUsername",
      });

      const res = await PUT(req, context);
      expect(connectToDatabase).toHaveBeenCalled();
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        "userId123",
        { username: "newUsername", password: "newPassword", role: "user" },
        { new: true }
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User updated successfully" });
    });

    it("should return 404 if user to update is not found", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "newUsername",
          password: "newPassword",
          role: "user",
        }),
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      (connectToDatabase as jest.Mock).mockResolvedValue({});
      // Simulate no matching user
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const res = await PUT(req, context);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });

    it("should return 500 (Internal server error) on exception", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "newUsername",
          password: "newPassword",
          role: "user",
        }),
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      // Simulate an error (e.g. DB connection failure)
      (connectToDatabase as jest.Mock).mockRejectedValue(new Error("DB error"));

      const res = await PUT(req, context);
      expect(log).toHaveBeenCalled(); // Error should be logged
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });

  // Tests for the DELETE endpoint
  describe("DELETE", () => {
    it("should return 401 (Unauthorized) if auth-session cookie is missing", async () => {
      const req = {
        cookies: { get: jest.fn().mockReturnValue(null) },
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      const res = await DELETE(req, context);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Unauthorized" });
    });

    it("should return 403 (Forbidden) if session role is not admin", async () => {
      const session = { role: "user" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      const res = await DELETE(req, context);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should delete user and return 200 when successful", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      (connectToDatabase as jest.Mock).mockResolvedValue({});
      // Simulate that deletion returns a user object.
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue({
        _id: "userId123",
      });

      const res = await DELETE(req, context);
      expect(connectToDatabase).toHaveBeenCalled();
      expect(User.findByIdAndDelete).toHaveBeenCalledWith("userId123");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "User deleted successfully" });
    });

    it("should return 404 if user to delete is not found", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      (connectToDatabase as jest.Mock).mockResolvedValue({});
      // Simulate that no user is found to delete.
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

      const res = await DELETE(req, context);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "User not found" });
    });

    it("should return 500 (Internal server error) on exception", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;
      const context = { params: { id: "userId123" } };

      (connectToDatabase as jest.Mock).mockResolvedValue({});
      // Simulate an error in deletion.
      (User.findByIdAndDelete as jest.Mock).mockRejectedValue(
        new Error("Delete error")
      );

      const res = await DELETE(req, context);
      expect(log).toHaveBeenCalled();
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: "Internal server error" });
    });
  });
});
