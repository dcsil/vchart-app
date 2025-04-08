import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Patient, { IPatient } from "@/lib/models/Patient";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import { log } from "@/app/utils/log";

// GET - Fetch patients for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const authSession = request.cookies.get("auth-session")?.value;
    const { username, _ } = authSession ? JSON.parse(authSession) : {};

    if (!username) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if a specific patient ID is requested
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("id");

    if (patientId) {
      // Fetch a single patient by ID
      const patient = await Patient.findOne({
        _id: patientId,
        nurseId: user._id,
      });

      if (!patient) {
        return NextResponse.json(
          { message: "Patient not found or not associated with this user" },
          { status: 404 }
        );
      }

      return NextResponse.json({ patient }, { status: 200 });
    }

    // Fetch all patients associated with the nurse
    const patients = await Patient.find({ nurseId: user._id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ patients }, { status: 200 });
  } catch (error) {
    log("Error fetching patients: " + error, "error");
    return NextResponse.json(
      { message: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}

// POST - Add a new patient
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const authSession = request.cookies.get("auth-session")?.value;
    const { username, role } = authSession ? JSON.parse(authSession) : {};

    if (!username) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { firstName, lastName, roomNumber, diagnosis } = await request.json();

    // Validate input
    if (!firstName || !lastName || !roomNumber || !diagnosis) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Create a new patient
    const patient = new Patient({
      firstName,
      lastName,
      roomNumber,
      diagnosis,
      nurseId: user._id,
    });

    // Save the patient
    await patient.save();

    return NextResponse.json(
      {
        message: "Patient added successfully",
        patient: {
          _id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          roomNumber: patient.roomNumber,
          diagnosis: patient.diagnosis,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log("Error adding patient: " + error, "error");
    return NextResponse.json(
      { message: "Failed to add patient" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a patient
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const authSession = request.cookies.get("auth-session")?.value;
    const { username, _ } = authSession ? JSON.parse(authSession) : {};

    if (!username) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Get patient ID from the URL
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("id");

    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if the patient exists and belongs to this user
    const patient = await Patient.findOne({
      _id: patientId,
      nurseId: user._id,
    });

    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found or not associated with this user" },
        { status: 404 }
      );
    }

    // Delete the patient document
    await Patient.findByIdAndDelete(patientId);

    return NextResponse.json(
      { message: "Patient deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    log("Error deleting patient: " + error, "error");
    return NextResponse.json(
      { message: "Failed to delete patient" },
      { status: 500 }
    );
  }
}
