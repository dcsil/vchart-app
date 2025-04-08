import { NextRequest } from "next/server";
import Patient from "@/lib/models/Patient";
import User from "@/lib/models/User";
import { GET, POST, DELETE } from "../route";

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((body: any, options?: { status?: number }) => ({
      status: options?.status || 200,
      json: async () => body,
    })),
  },
}));

jest.mock("@/lib/mongodb", () => jest.fn().mockResolvedValue({}));

jest.mock("@/lib/models/Patient", () => {
  return jest.fn().mockImplementation(function (this: any, patientData: any) {
    Object.assign(this, patientData);
    this.save = jest.fn().mockImplementation(() => {
      this._id = "patient123";
      return Promise.resolve(this);
    });
  });
});

(Patient as any).find = jest.fn().mockResolvedValue([]);
(Patient as any).findOne = jest.fn();
(Patient as any).findByIdAndDelete = jest.fn().mockResolvedValue({});

jest.mock("@/lib/models/User", () => ({
  findOne: jest.fn(),
}));

jest.mock("@/app/utils/log", () => ({
  log: jest.fn(),
}));

describe("Patients API Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = (
    cookie: { value: string } | undefined,
    url: string,
    body?: any
  ): NextRequest =>
    ({
      cookies: { get: jest.fn().mockReturnValue(cookie) },
      url,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest);

  describe("POST", () => {
    it("creates patient successfully", async () => {
      const patientData = {
        firstName: "John",
        lastName: "Doe",
        roomNumber: "101",
        diagnosis: "Flu",
      };
      const req = mockRequest(
        { value: JSON.stringify({ username: "test" }) },
        "http://localhost/api/patients",
        patientData
      );

      (User.findOne as jest.Mock).mockResolvedValueOnce({ _id: "nurse123" });

      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual({
        message: "Patient added successfully",
        patient: { _id: "patient123", ...patientData },
      });
    });
  });
});
