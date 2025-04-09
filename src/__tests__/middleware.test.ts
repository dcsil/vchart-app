import { NextRequest, NextResponse } from "next/server";
import { middleware } from "../middleware";

jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextResponse: {
      redirect: jest.fn().mockImplementation((url) => ({
        redirectUrl: url,
        type: "redirect",
      })),
      next: jest.fn().mockImplementation(() => ({
        type: "next",
      })),
    },
  };
});

describe("Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (
    pathname: string,
    authCookie?: object | string
  ) => {
    const cookieValue =
      typeof authCookie === "object" ? JSON.stringify(authCookie) : authCookie;

    return {
      nextUrl: {
        pathname,
        origin: "http://localhost",
        protocol: "http",
      },
      url: "http://localhost" + pathname,
      cookies: {
        get: jest.fn().mockImplementation((name) => {
          if (name === "auth-session" && cookieValue) {
            return { value: cookieValue };
          }
          return undefined;
        }),
      },
    } as unknown as NextRequest;
  };

  it("should redirect non-logged-in users to login page if accessing protected routes", () => {
    const req = createMockRequest("/patients/123");
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/login", req.url)
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it("should allow non-logged-in users to access login page", () => {
    const req = createMockRequest("/login");
    middleware(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should redirect logged-in admin users to admin home if accessing login page", () => {
    const req = createMockRequest("/login", { role: "admin" });
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/admin/users", req.url)
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it("should redirect logged-in non-admin users to user home if accessing login page", () => {
    const req = createMockRequest("/login", { role: "nurse" });
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/", req.url));
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it("should redirect admin users accessing non-admin pages to admin home", () => {
    const req = createMockRequest("/patients/456", { role: "admin" });
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/admin/users", req.url)
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it("should allow admin users to access the admin users page", () => {
    const req = createMockRequest("/admin/users", { role: "admin" });
    middleware(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should allow admin users to access /api/logtail", () => {
    const req = createMockRequest("/api/logtail", { role: "admin" });
    middleware(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should redirect non-admin users trying to access admin users page to home", () => {
    const req = createMockRequest("/admin/users", { role: "nurse" });
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(new URL("/", req.url));
    expect(NextResponse.next).not.toHaveBeenCalled();
  });

  it("should allow non-admin users to access non-admin routes", () => {
    const req = createMockRequest("/patients/789", { role: "nurse" });
    middleware(req);
    expect(NextResponse.redirect).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it("should redirect to login if auth cookie parsing fails", () => {
    const req = createMockRequest("/patients/101", "malformed-json");
    middleware(req);
    expect(NextResponse.redirect).toHaveBeenCalledWith(
      new URL("/login", req.url)
    );
    expect(NextResponse.next).not.toHaveBeenCalled();
  });
});
