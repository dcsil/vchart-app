import { NextRequest, NextResponse } from "next/server";
import { POST } from "../login/route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { log } from "@/app/utils/log";

jest.mock("@/lib/mongodb", () => jest.fn());

jest.mock("@/lib/models/User", () => ({
  findOne: jest.fn(),
}));

jest.mock("@/app/utils/log", () => ({
  log: jest.fn(),
}));

jest.mock("next/server", () => {
  return {
    NextRequest: jest.requireActual("next/server").NextRequest,
    NextResponse: {
      json: jest.fn((data, options) => ({
        data,
        options,
        cookies: {
          set: jest.fn(),
        },
      })),
    },
  };
});

describe("Login API Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: Record<string, unknown>) => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  it("should return 400 if username or password is missing", async () => {
    // Missing username
    await POST(createMockRequest({ password: "password123" }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Username and password are required" },
      { status: 400 }
    );

    // Missing password
    await POST(createMockRequest({ username: "testuser" }));
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Username and password are required" },
      { status: 400 }
    );
  });

  it("should connect to the database", async () => {
    const mockRequest = createMockRequest({
      username: "testuser",
      password: "password123",
    });
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await POST(mockRequest);

    expect(connectToDatabase).toHaveBeenCalled();
  });

  it("should return 401 if credentials are invalid", async () => {
    const mockRequest = createMockRequest({
      username: "testuser",
      password: "wrongpass",
    });
    (User.findOne as jest.Mock).mockResolvedValue(null);

    await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Invalid username or password" },
      { status: 401 }
    );
  });

  it("should return 200 and set cookie with user role for valid login", async () => {
    const userMock = { username: "testuser", role: "admin" };
    const mockRequest = createMockRequest({
      username: "testuser",
      password: "password123",
    });

    (User.findOne as jest.Mock).mockResolvedValue(userMock);

    const response = await POST(mockRequest);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        message: "Login successful",
        user: {
          username: userMock.username,
          role: userMock.role,
        },
      },
      { status: 200 }
    );

    expect(response.cookies.set).toHaveBeenCalledWith({
      name: "auth-session",
      value: JSON.stringify({
        username: userMock.username,
        role: userMock.role,
      }),
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: expect.any(Boolean),
      maxAge: 60 * 60 * 24 * 7,
    });

    expect(log).toHaveBeenCalledWith("User role: admin", "debug");
  });

  it("should handle errors and return 500", async () => {
    const mockRequest = createMockRequest({
      username: "testuser",
      password: "password123",
    });
    (connectToDatabase as jest.Mock).mockRejectedValue(
      new Error("Database failed")
    );

    await POST(mockRequest);

    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Login error"),
      "error"
    );

    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Internal server error" },
      { status: 500 }
    );
  });
});
