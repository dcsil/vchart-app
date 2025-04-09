import { NextRequest, NextResponse } from "next/server";
import { GET, POST, DELETE } from "../route";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import Patient from "@/lib/models/Patient";
import { log } from "@/app/utils/log";

// Mock external dependencies.
jest.mock("@/lib/mongodb", () => jest.fn().mockResolvedValue({}));
jest.mock("@/lib/models/User");
jest.mock("@/lib/models/Patient");
jest.mock("@/app/utils/log", () => ({ log: jest.fn() }));

// Override NextResponse.json so that tests can inspect the response and call .json()
beforeEach(() => {
  jest.spyOn(NextResponse, "json").mockImplementation((body, init) => {
    return {
      status: init?.status || 200,
      // Provide a json method so that res.json() can be awaited by tests.
      json: async () => body,
      body,
    } as unknown as NextResponse;
  });
  jest.clearAllMocks();
});

// Helper function to simulate a NextRequest.
interface CreateRequestOptions {
  cookieValue?: string;
  url?: string;
  jsonBody?: any;
}
function createNextRequest({
  cookieValue,
  url,
  jsonBody,
}: CreateRequestOptions): NextRequest {
  return {
    cookies: {
      get: jest
        .fn()
        .mockReturnValue(cookieValue ? { value: cookieValue } : null),
    },
    url: url || "http://localhost/api/patients",
    json: jsonBody ? jest.fn().mockResolvedValue(jsonBody) : jest.fn(),
  } as unknown as NextRequest;
}

describe("Patients API Routes - GET", () => {
  it("returns 401 if auth-session cookie is missing", async () => {
    const req = createNextRequest({ cookieValue: undefined });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("returns 401 if auth-session cookie has no username", async () => {
    const req = createNextRequest({ cookieValue: JSON.stringify({}) });
    const res = await GET(req);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("returns 404 if user is not found", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns a single patient when id is provided and patient exists", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "patient123",
      firstName: "John",
      lastName: "Doe",
      roomNumber: "101",
      diagnosis: "Flu",
      nurseId: "nurse123",
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    // Updated expected value to include nurseId.
    expect(res.body).toEqual({
      patient: {
        _id: "patient123",
        firstName: "John",
        lastName: "Doe",
        roomNumber: "101",
        diagnosis: "Flu",
        nurseId: "nurse123",
      },
    });
  });

  it("returns 404 if patient id is provided but not found", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await GET(req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: "Patient not found or not associated with this user",
    });
  });

  it("returns all patients when no id is provided", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.find as jest.Mock).mockReturnValueOnce({
      sort: jest.fn().mockResolvedValueOnce([
        { _id: "p1", firstName: "Alice" },
        { _id: "p2", firstName: "Bob" },
      ]),
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      patients: [
        { _id: "p1", firstName: "Alice" },
        { _id: "p2", firstName: "Bob" },
      ],
    });
  });

  it("returns 500 if an error occurs in GET", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
    });
    (connectToDatabase as jest.Mock).mockRejectedValueOnce(
      new Error("DB Error")
    );
    const res = await GET(req);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to fetch patients" });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Error fetching patients:"),
      "error"
    );
  });
});

describe("Patients API Routes - POST", () => {
  it("returns 401 if auth-session cookie is missing", async () => {
    const req = createNextRequest({ cookieValue: undefined, jsonBody: {} });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("returns 400 if required fields are missing", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      jsonBody: { firstName: "John", lastName: "Doe" }, // missing roomNumber and diagnosis
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "All fields are required" });
  });

  it("returns 404 if user is not found", async () => {
    const patientData = {
      firstName: "John",
      lastName: "Doe",
      roomNumber: "101",
      diagnosis: "Flu",
    };
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      jsonBody: patientData,
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await POST(req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns 201 when patient is added successfully", async () => {
    const patientData = {
      firstName: "John",
      lastName: "Doe",
      roomNumber: "101",
      diagnosis: "Flu",
    };
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      jsonBody: patientData,
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    // Mock the Patient constructor to simulate a successful save.
    (Patient as any).mockImplementation(function (this: any, data: any) {
      Object.assign(this, data);
      this.save = jest.fn().mockImplementation(() => {
        this._id = "patient123";
        return Promise.resolve(this);
      });
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      message: "Patient added successfully",
      patient: {
        _id: "patient123",
        firstName: "John",
        lastName: "Doe",
        roomNumber: "101",
        diagnosis: "Flu",
      },
    });
  });

  it("returns 500 if an error occurs in POST", async () => {
    const patientData = {
      firstName: "John",
      lastName: "Doe",
      roomNumber: "101",
      diagnosis: "Flu",
    };
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      jsonBody: patientData,
    });
    (connectToDatabase as jest.Mock).mockRejectedValueOnce(
      new Error("DB Error")
    );
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to add patient" });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Error adding patient:"),
      "error"
    );
  });
});

describe("Patients API Routes - DELETE", () => {
  it("returns 401 if auth-session cookie is missing", async () => {
    const req = createNextRequest({
      cookieValue: undefined,
      url: "http://localhost/api/patients?id=123",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required" });
  });

  it("returns 400 if patient ID is not provided", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Patient ID is required" });
  });

  it("returns 404 if user is not found", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await DELETE(req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("returns 404 if patient is not found or not associated with the user", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.findOne as jest.Mock).mockResolvedValueOnce(null);
    const res = await DELETE(req);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      message: "Patient not found or not associated with this user",
    });
  });

  it("returns 200 when patient is deleted successfully", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "patient123",
      nurseId: "nurse123",
    });
    (Patient.findByIdAndDelete as jest.Mock).mockResolvedValueOnce({});
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Patient deleted successfully" });
  });

  it("returns 500 if an error occurs in DELETE", async () => {
    const req = createNextRequest({
      cookieValue: JSON.stringify({ username: "testuser" }),
      url: "http://localhost/api/patients?id=patient123",
    });
    (User.findOne as jest.Mock).mockResolvedValueOnce({
      _id: "nurse123",
      username: "testuser",
    });
    (Patient.findOne as jest.Mock).mockRejectedValueOnce(
      new Error("Delete error")
    );
    const res = await DELETE(req);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Failed to delete patient" });
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining("Error deleting patient:"),
      "error"
    );
  });
});
