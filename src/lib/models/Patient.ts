import mongoose from 'mongoose';

// Define Patient interface
export interface IPatient extends mongoose.Document {
  firstName: string;
  lastName: string;
  roomNumber: string;
  diagnosis: string;
  entries: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// Define Patient schema
const PatientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
  },
  diagnosis: {
    type: String,
    required: [true, 'Diagnosis is required'],
  },
  entries: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Entry'
    }],
    default: [] // Initialize with an empty array
  }
}, { timestamps: true });

// Clear the model cache to ensure the updated schema is used
if (mongoose.models.Patient) {
  delete mongoose.models.Patient;
}

// Create the model with the updated schema
const Patient = mongoose.model<IPatient>('Patient', PatientSchema, 'patients');

export default Patient; 