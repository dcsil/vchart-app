import mongoose from "mongoose";

// Define Entry interface
export interface IEntry extends mongoose.Document {
  patientId: mongoose.Types.ObjectId;
  temperature: string;
  bloodPressure: string;
  pulseRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  painLevel: string;
  transcript: string;
  reviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define Entry schema
const EntrySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    temperature: {
      type: String,
    },
    bloodPressure: {
      type: String,
    },
    pulseRate: {
      type: String,
    },
    respiratoryRate: {
      type: String,
    },
    oxygenSaturation: {
      type: String,
    },
    painLevel: {
      type: String,
    },
    transcript: {
      type: String,
      default: "",
    },
    reviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Clear the model cache to ensure the updated schema is used
if (mongoose.models.Entry) {
  delete mongoose.models.Entry;
}

// Create the model with the updated schema
const Entry = mongoose.model<IEntry>("Entry", EntrySchema, "entries");

export default Entry;
