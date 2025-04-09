import mongoose from "mongoose";

export interface IPatient extends mongoose.Document {
  firstName: string;
  lastName: string;
  roomNumber: string;
  diagnosis: string;
  nurseId: mongoose.Types.ObjectId; // New field to link a patient to a nurse
  entries: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    roomNumber: {
      type: String,
      required: [true, "Room number is required"],
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Nurse ID is required"], // ensure each patient is linked to a nurse
      index: true, // creates an index to speed up queries by nurse
    },
    entries: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Entry",
        },
      ],
      default: [], // Initialize with an empty array
    },
  },
  { timestamps: true }
);

if (mongoose.models.Patient) {
  delete mongoose.models.Patient;
}

const Patient = mongoose.model<IPatient>("Patient", PatientSchema, "patients");

export default Patient;
