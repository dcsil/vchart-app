import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Patient, { IPatient } from '@/lib/models/Patient';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { log } from "@/app/utils/log";

// GET - Fetch patients for the current user
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const username = request.cookies.get('auth-session')?.value;

    if (!username) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if a specific patient ID is requested
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id');

    if (patientId) {
      // Fetch a single patient by ID
      if (user.patients && user.patients.some(id => id.toString() === patientId)) {
        const patient = await Patient.findById(patientId);
        
        if (!patient) {
          return NextResponse.json(
            { message: 'Patient not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(
          { patient },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { message: 'Patient not found or not associated with this user' },
          { status: 404 }
        );
      }
    }

    // Fetch all patients based on user's patient array
    let patients = [];
    if (user.patients && user.patients.length > 0) {
      patients = await Patient.find({
        _id: { $in: user.patients }
      }).sort({ createdAt: -1 }); // Sort by most recent first
    }

    return NextResponse.json(
      { patients },
      { status: 200 }
    );
  } catch (error) {
    log('Error fetching patients: ' + error, 'error');
    return NextResponse.json(
      { message: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// POST - Add a new patient
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const username = request.cookies.get('auth-session')?.value;

    if (!username) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse the request body
    const { firstName, lastName, roomNumber, diagnosis } = await request.json();

    // Validate input
    if (!firstName || !lastName || !roomNumber || !diagnosis) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Create a new patient
    const patient = new Patient({
      firstName,
      lastName,
      roomNumber,
      diagnosis
    });

    // Save the patient
    await patient.save();

    // Initialize patients array if it doesn't exist
    if (!user.patients) {
      user.patients = [];
    }

    // Add the patient ID to the user's patients array
    user.patients.push(patient._id);
    await user.save();

    return NextResponse.json(
      { 
        message: 'Patient added successfully',
        patient: {
          _id: patient._id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          roomNumber: patient.roomNumber,
          diagnosis: patient.diagnosis
        }
      },
      { status: 201 }
    );
  } catch (error) {
    log('Error adding patient: ' + error, 'error');
    return NextResponse.json(
      { message: 'Failed to add patient' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a patient
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user from the cookie
    const username = request.cookies.get('auth-session')?.value;

    if (!username) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get patient ID from the URL
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('id');

    if (!patientId) {
      return NextResponse.json(
        { message: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the patient exists and belongs to this user
    if (!user.patients || !user.patients.some(id => id.toString() === patientId)) {
      return NextResponse.json(
        { message: 'Patient not found or not associated with this user' },
        { status: 404 }
      );
    }

    // Remove patient ID from user's patients array
    user.patients = user.patients.filter(id => id.toString() !== patientId);
    await user.save();

    // Delete the patient document
    await Patient.findByIdAndDelete(patientId);

    return NextResponse.json(
      { message: 'Patient deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    log('Error deleting patient: ' + error, 'error');
    return NextResponse.json(
      { message: 'Failed to delete patient' },
      { status: 500 }
    );
  }
} 