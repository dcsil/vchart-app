import mongoose from 'mongoose';

// Define Entry interface
export interface IEntry extends mongoose.Document {
  patientId: mongoose.Types.ObjectId;
  temperature: string;
  bloodPressure: string;
  pulseRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  painLevel: string;
  reviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define Entry schema
const EntrySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required'],
  },
  temperature: {
    type: String,
    required: [true, 'Temperature is required'],
  },
  bloodPressure: {
    type: String,
    required: [true, 'Blood pressure is required'],
  },
  pulseRate: {
    type: String,
    required: [true, 'Pulse rate is required'],
  },
  respiratoryRate: {
    type: String,
    required: [true, 'Respiratory rate is required'],
  },
  oxygenSaturation: {
    type: String,
    required: [true, 'Oxygen saturation is required'],
  },
  painLevel: {
    type: String,
    required: [true, 'Pain level is required'],
  },
  reviewed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Clear the model cache to ensure the updated schema is used
if (mongoose.models.Entry) {
  delete mongoose.models.Entry;
}

// Create the model with the updated schema
const Entry = mongoose.model<IEntry>('Entry', EntrySchema, 'entries');

export default Entry; 