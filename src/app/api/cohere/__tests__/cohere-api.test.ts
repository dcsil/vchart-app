import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock environment variable
process.env.COHERE_API_KEY = "test-api-key";

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        temperature: "98.6",
        bloodPressure: "120/80",
        pulseRate: "72",
        respiratoryRate: "16",
        oxygenSaturation: "98%",
        painLevel: "5",
      }),
  })
) as jest.Mock;

// Mock NextRequest
class MockNextRequest {
  constructor(
    public url: string,
    public init: { body: string; method: string }
  ) {}
  json() {
    return Promise.resolve(JSON.parse(this.init.body));
  }
}

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    })),
  },
}));

describe("POST /api/cohere", () => {
  it("should return 400 if transcript is missing", async () => {
    const req = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Transcript is required.");
  });

  it("should return 500 if Cohere API key is missing", async () => {
    delete process.env.COHERE_API_KEY;

    const req = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ transcript: "Sample transcript" }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Cohere API key not set.");
  });

  it("should return 200 and a JSON object on success", async () => {
    process.env.COHERE_API_KEY = "test-api-key";

    const req = new MockNextRequest("http://localhost", {
      method: "POST",
      body: JSON.stringify({ transcript: "Sample transcript" }),
    });

    const res = await POST(req as unknown as NextRequest);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({
      temperature: "98.6",
      bloodPressure: "120/80",
      pulseRate: "72",
      respiratoryRate: "16",
      oxygenSaturation: "98%",
      painLevel: "5",
    });
  });
});
