import mongoose from "mongoose";

// Define the interface for the flexible EMR entry document
export interface IEntry extends mongoose.Document {
  patientId: mongoose.Types.ObjectId; // Must be provided for every entry

  // Vital signs may be auto-populated or selectively recorded
  vitalSigns?: {
    temperature?: {
      value?: number; // Body temperature
      unit?: "C" | "F"; // Unit for temperature with default "C"
    };
    bloodPressure?: {
      systolic?: number; // Systolic pressure (mmHg)
      diastolic?: number; // Diastolic pressure (mmHg)
      unit?: string; // Default is "mmHg"
    };
    heartRate?: number; // Beats per minute
    respiratoryRate?: number; // Breaths per minute
    oxygenSaturation?: number; // Percentage saturation
  };

  // Subjective data: patient-reported information
  subjective?: {
    chiefComplaint?: string; // Patient's primary complaint
    symptomHistory?: string; // Narrative on symptom evolution
    painLevel?: number; // Pain score (0–10 scale)
  };

  // Objective exam findings from the physical assessment
  objective?: {
    generalAppearance?: string; // Overall appearance (e.g., alert, distressed)
    cardiovascular?: string; // Heart findings (e.g., rhythm, murmurs)
    respiratory?: string; // Lung exam (e.g., clear, crackles)
    neurological?: string; // Neurological status (e.g., oriented, lethargic)
    skin?: string; // Skin assessment details
    additionalExam?: string; // Other physical findings
  };

  // Clinical assessment and treatment plan
  assessment?: string; // Evaluation/analysis of the patient's condition
  plan?: string; // Next steps for care or follow-up actions

  // Indicates whether the record has been reviewed by another clinician
  reviewed?: boolean;

  transcript?: string;

  // Timestamps (createdAt and updatedAt managed automatically by Mongoose)
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the flexible EMR entry schema
const EntrySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient ID is required"],
    },
    vitalSigns: {
      temperature: {
        value: { type: Number },
        unit: { type: String, enum: ["C", "F"], default: "C" },
      },
      bloodPressure: {
        systolic: { type: Number },
        diastolic: { type: Number },
        unit: { type: String, default: "mmHg" },
      },
      heartRate: { type: Number },
      respiratoryRate: { type: Number },
      oxygenSaturation: { type: Number },
    },
    subjective: {
      chiefComplaint: { type: String, default: "" },
      symptomHistory: { type: String, default: "" },
      painLevel: { type: Number, min: 0, max: 10 },
    },
    objective: {
      generalAppearance: { type: String, default: "" },
      cardiovascular: { type: String, default: "" },
      respiratory: { type: String, default: "" },
      neurological: { type: String, default: "" },
      skin: { type: String, default: "" },
      additionalExam: { type: String, default: "" },
    },
    assessment: { type: String, default: "" },
    plan: { type: String, default: "" },
    reviewed: { type: Boolean, default: false },
    transcript: {
      type: String,
      default: "",
    },
  },

  { timestamps: true }
);

// Clear previous model definition if exists (useful in development)
if (mongoose.models.Entry) {
  delete mongoose.models.Entry;
}

// Create the model using the defined schema
const Entry = mongoose.model<IEntry>("Entry", EntrySchema, "entries");

export default Entry;
