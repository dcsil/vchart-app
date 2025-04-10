import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // If the request is for the logo, bypass middleware
  if (pathname === "/logo.png") {
    return NextResponse.next();
  }

  const authSession = request.cookies.get("auth-session");
  const isLoginPage = pathname === "/login";

  // If the user is not logged in and is not on the login page, redirect to login.
  if (!authSession) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Parse the session cookie (assumes it was set as a JSON string with properties like "role")
  let sessionData;
  try {
    sessionData = JSON.parse(authSession.value);
  } catch {
    // In case of parsing error, clear cookie and redirect to login.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { role } = sessionData;

  // If the logged-in user attempts to access the login page, send them to their appropriate home.
  if (isLoginPage) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    } else {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Enforce role-based restrictions for other pages:
  if (role === "admin") {
    // Admins should only access /admin routes and /api/logtail.
    if (!pathname.startsWith("/admin") && pathname !== "/api/logtail") {
      return NextResponse.redirect(new URL("/admin/users", request.url));
    }
  } else {
    // Non-admin users should not access /admin routes.
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // If no restrictions apply, allow the request to continue.
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply middleware to all requests except API routes, static files, image optimization and favicon.
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
