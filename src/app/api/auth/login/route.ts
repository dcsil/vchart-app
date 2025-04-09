import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { log } from "@/app/utils/log";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check if user exists with the provided credentials
    const user = await User.findOne({ username, password });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Log user's role for debugging purposes
    log("User role: " + user.role, "debug");

    // Create a response including the user's role
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          username: user.username,
          role: user.role, // include the role here
        },
      },
      { status: 200 }
    );

    // Store session information including the role in a cookie.
    // You can parse this cookie later to enforce role-based access.
    response.cookies.set({
      name: "auth-session",
      value: JSON.stringify({ username: user.username, role: user.role }),
      path: "/",
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    log("Login error: " + error, "error");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
