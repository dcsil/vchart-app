import { GET, POST } from "../route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse, NextRequest } from "next/server";
import { log } from "@/app/utils/log";

process.env.MONGODB_URI = "mongodb://localhost:27017/test";

// MOCK the mongodb connection module so that it always resolves immediately.
jest.mock("@/lib/mongodb", () => {
  return jest.fn(() => Promise.resolve({})); // returns a dummy connection object
});

// MOCK the User model and log utility.
jest.mock("@/lib/models/User");
jest.mock("@/app/utils/log");

describe("API Route Handlers", () => {
  // Override NextResponse.json so that we can inspect the response.
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

  // GET handler tests
  describe("GET", () => {
    it("should return 403 if there is no auth-session cookie", async () => {
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as NextRequest;

      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should return 403 if the session is not admin", async () => {
      const session = { role: "user" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;

      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should return 403 if the auth-session cookie contains invalid JSON", async () => {
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: "invalid json" }),
        },
      } as unknown as NextRequest;

      const res = await GET(req);
      // Expect the error logging function to have been called
      expect(log).toHaveBeenCalled();
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should return 200 with users when session is admin", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
      } as unknown as NextRequest;

      // In this test, the mocked dbConnect (the entire module) automatically resolves.
      const fakeUsers = [{ username: "user1" }, { username: "user2" }];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUsers),
      });

      const res = await GET(req);
      expect(dbConnect).toHaveBeenCalled();
      expect(User.find).toHaveBeenCalledWith({});
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ users: fakeUsers });
    });
  });

  // POST handler tests
  describe("POST", () => {
    it("should return 403 if there is no auth-session cookie", async () => {
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue(null),
        },
        json: jest.fn(),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ message: "Forbidden" });
    });

    it("should return 400 if missing required fields in the POST body", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "testUser",
          password: "",
          role: "",
        }),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Missing required fields" });
    });

    it("should return 409 if a user with the provided username already exists", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "existingUser",
          password: "pass",
          role: "user",
        }),
      } as unknown as NextRequest;

      // Simulate that a user is found in the DB.
      (User.findOne as jest.Mock).mockResolvedValue({
        username: "existingUser",
      });

      const res = await POST(req);
      expect(dbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ username: "existingUser" });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ message: "User already exists" });
    });

    it("should create a new user and return 201 when successful", async () => {
      const session = { role: "admin" };
      const req = {
        cookies: {
          get: jest.fn().mockReturnValue({ value: JSON.stringify(session) }),
        },
        json: jest.fn().mockResolvedValue({
          username: "newUser",
          password: "pass",
          role: "user",
        }),
      } as unknown as NextRequest;

      // Simulate that no user exists with the given username.
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Create a mock implementation for the new User instance and its save method.
      const saveMock = jest.fn().mockResolvedValue(undefined);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const res = await POST(req);
      expect(dbConnect).toHaveBeenCalled();
      expect(User.findOne).toHaveBeenCalledWith({ username: "newUser" });
      expect(saveMock).toHaveBeenCalled();
      expect(res.status).toBe(201);
      expect(res.body).toEqual({ message: "User created successfully" });
    });
  });
});
