import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Entry from "@/lib/models/Entry";
import Patient from "@/lib/models/Patient";
import mongoose from "mongoose";
import { log } from "@/app/utils/log";

// GET - Fetch entries for a patient
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const username = request.cookies.get("auth-session")?.value;

    if (!username) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get patient ID and entry ID from the URL
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const entryId = searchParams.get("id");

    // If entry ID is provided, fetch a single entry
    if (entryId) {
      const entry = await Entry.findById(entryId);

      if (!entry) {
        return NextResponse.json(
          { message: "Entry not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ entry }, { status: 200 });
    }

    // If only patient ID is provided, fetch all entries for that patient
    if (patientId) {
      const entries = await Entry.find({
        patientId: patientId,
      }).sort({ createdAt: -1 }); // Sort by most recent first

      return NextResponse.json({ entries }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Patient ID or Entry ID is required" },
      { status: 400 }
    );
  } catch (error) {
    log("Error fetching entries: " + error, "error");
    return NextResponse.json(
      { message: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

// POST - Add a new entry
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user session string from the cookie
    const sessionCookie = request.cookies.get("auth-session")?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const {
      patientId,
      vitalSigns,
      subjective,
      objective,
      assessment,
      plan,
      transcript,
    } = await request.json();

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { message: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found" },
        { status: 404 }
      );
    }

    // Create new entry
    const entry = new Entry({
      patientId,
      vitalSigns,
      subjective,
      objective,
      assessment,
      plan,
      transcript,
    });

    // Save the entry
    await entry.save();

    // Add entry to patient's entries array
    if (!patient.entries) {
      patient.entries = [];
    }
    patient.entries.push(entry._id as unknown as mongoose.Types.ObjectId);
    await patient.save();

    return NextResponse.json(
      {
        message: "Entry added successfully",
        entry,
      },
      { status: 201 }
    );
  } catch (error) {
    let errorMessage = "Failed to add entry";
    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        errorMessage = `Validation Error: ${error.message}`;
        log(
          `Validation Error adding entry: ${JSON.stringify(
            (error as mongoose.Error.ValidationError).errors
          )}`,
          "warn"
        );
      } else {
        errorMessage = `Failed to add entry: ${error.message}`;
      }
    }
    log(`Error adding entry: ${error}`, "error");
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}

// PUT - Update an entry
export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const username = request.cookies.get("auth-session")?.value;

    if (!username) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse the request body
    const data = await request.json();
    const {
      id,
      vitalSigns,
      subjective,
      objective,
      assessment,
      plan,
      reviewed,
      transcript,
    } = data;

    if (!id) {
      return NextResponse.json(
        { message: "Entry ID is required" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the entry
    const entry = await Entry.findById(id as string);

    if (!entry) {
      return NextResponse.json({ message: "Entry not found" }, { status: 404 });
    }

    // Update only fields that are provided
    if (vitalSigns !== undefined)
      entry.vitalSigns = { ...entry.vitalSigns, ...vitalSigns };
    if (subjective !== undefined)
      entry.subjective = { ...entry.subjective, ...subjective };
    if (objective !== undefined)
      entry.objective = { ...entry.objective, ...objective };
    if (assessment !== undefined) entry.assessment = assessment;
    if (plan !== undefined) entry.plan = plan;
    if (reviewed !== undefined) entry.reviewed = reviewed;
    if (transcript !== undefined) entry.transcript = transcript;

    // Save the updated entry
    await entry.save();

    return NextResponse.json(
      {
        message: "Entry updated successfully",
        entry,
      },
      { status: 200 }
    );
  } catch (error) {
    log("Error updating entry: " + error, "error");
    return NextResponse.json(
      { message: "Failed to update entry" },
      { status: 500 }
    );
  }
}
