import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { log } from "@/app/utils/log";

// Helper function to get session data from our custom cookie
function getSession(request: NextRequest) {
  const authSession = request.cookies.get("auth-session");
  if (!authSession) {
    return null;
  }
  try {
    return JSON.parse(authSession.value);
  } catch (err) {
    log("Failed to parse session cookie");
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = getSession(req);

  // Check if the session exists and if the user has the admin role
  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  await dbConnect();
  const users = await User.find({}).select("-password");
  return NextResponse.json({ users }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const session = getSession(req);

  if (!session || session.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  // Parse incoming JSON for new user details
  const { username, password, role } = await req.json();

  if (!username || !password || !role) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  await dbConnect();

  // Check if a user with the provided username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  const newUser = new User({ username, password: password, role });
  await newUser.save();

  return NextResponse.json(
    { message: "User created successfully" },
    { status: 201 }
  );
}
