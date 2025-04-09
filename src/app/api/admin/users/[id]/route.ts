import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/User";
import { log } from "@/app/utils/log";

// Helper function to extract the session from the auth-session cookie
function getSession(request: NextRequest) {
  const authSession = request.cookies.get("auth-session");
  if (!authSession) {
    return null;
  }
  try {
    return JSON.parse(authSession.value);
  } catch (err) {
    log("Failed to parse auth-session cookie: " + err, "error");
    return null;
  }
}

// PUT: Update a user account
export async function PUT(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  // Await the params before using them
  const { id: userId } = await params;

  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { username, password, role } = await request.json();
    await connectToDatabase();

    const updateData: { username?: string; role?: string; password?: string } =
      {};
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    // Directly storing the plain password per request instructions (not recommended)
    if (password) updateData.password = password;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    log("Error in PUT /api/admin/users/[id]: " + error, "error");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a user account
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  }
) {
  // Await the params before using them
  const { id: userId } = await params;

  try {
    const session = getSession(request);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    log("Error in DELETE /api/admin/users/[id]: " + error, "error");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
