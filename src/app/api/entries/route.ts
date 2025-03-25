import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Entry, { IEntry } from '@/lib/models/Entry';
import Patient from '@/lib/models/Patient';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';

// GET - Fetch entries for a patient
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

    // Get patient ID and entry ID from the URL
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const entryId = searchParams.get('id');

    // If entry ID is provided, fetch a single entry
    if (entryId) {
      const entry = await Entry.findById(entryId);
      
      if (!entry) {
        return NextResponse.json(
          { message: 'Entry not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { entry },
        { status: 200 }
      );
    }

    // If only patient ID is provided, fetch all entries for that patient
    if (patientId) {
      const entries = await Entry.find({ 
        patientId: patientId 
      }).sort({ createdAt: -1 }); // Sort by most recent first

      return NextResponse.json(
        { entries },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'Patient ID or Entry ID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { message: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST - Add a new entry
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
    const { 
      patientId, 
      temperature, 
      bloodPressure, 
      pulseRate, 
      respiratoryRate, 
      oxygenSaturation, 
      painLevel 
    } = await request.json();

    // Validate required fields
    if (!patientId || !temperature || !bloodPressure || !pulseRate || 
        !respiratoryRate || !oxygenSaturation || !painLevel) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return NextResponse.json(
        { message: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create new entry
    const entry = new Entry({
      patientId,
      temperature,
      bloodPressure,
      pulseRate,
      respiratoryRate,
      oxygenSaturation,
      painLevel
    });

    // Save the entry
    await entry.save();

    // Add entry to patient's entries array
    if (!patient.entries) {
      patient.entries = [];
    }
    patient.entries.push(entry._id);
    await patient.save();

    return NextResponse.json(
      { 
        message: 'Entry added successfully',
        entry
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding entry:', error);
    return NextResponse.json(
      { message: 'Failed to add entry' },
      { status: 500 }
    );
  }
}

// PUT - Update an entry
export async function PUT(request: NextRequest) {
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
    const data = await request.json();
    const { 
      id,
      temperature, 
      bloodPressure, 
      pulseRate, 
      respiratoryRate, 
      oxygenSaturation, 
      painLevel,
      reviewed
    } = data;

    if (!id) {
      return NextResponse.json(
        { message: 'Entry ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Find the entry
    const entry = await Entry.findById(id as string);
    
    if (!entry) {
      return NextResponse.json(
        { message: 'Entry not found' },
        { status: 404 }
      );
    }

    // Update only fields that are provided
    if (temperature !== undefined) entry.temperature = temperature;
    if (bloodPressure !== undefined) entry.bloodPressure = bloodPressure;
    if (pulseRate !== undefined) entry.pulseRate = pulseRate;
    if (respiratoryRate !== undefined) entry.respiratoryRate = respiratoryRate;
    if (oxygenSaturation !== undefined) entry.oxygenSaturation = oxygenSaturation;
    if (painLevel !== undefined) entry.painLevel = painLevel;
    if (reviewed !== undefined) entry.reviewed = reviewed;

    // Save the updated entry
    await entry.save();

    return NextResponse.json(
      { 
        message: 'Entry updated successfully',
        entry
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { message: 'Failed to update entry' },
      { status: 500 }
    );
  }
} 