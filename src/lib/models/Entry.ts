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

  // Records for medications administered during the encounter
  medications?: Array<{
    medicationName?: string; // Name of the medication
    dose?: string; // Dosage details (e.g., "500 mg", "1 tablet")
    route?: string; // Route of administration (e.g., oral, IV)
    timeAdministered?: Date; // Time when the medication was given
    response?: string; // Observations on response or adverse effects
  }>;

  // Records of any interventions performed
  interventions?: Array<{
    description?: string; // Details of the procedure/intervention
    performedAt?: Date; // Time when the intervention was carried out
    outcome?: string; // Immediate results or outcomes
  }>;

  // Diagnostic tests including labs and imaging studies
  diagnostics?: {
    labs?: Array<{
      testName?: string; // Name of the lab test (e.g., CBC, CMP)
      result?: string; // Result values
      unit?: string; // Unit for the result if applicable
      referenceRange?: string; // Expected normal range
      collectedAt?: Date; // Time of sample collection
    }>;
    imaging?: Array<{
      examName?: string; // Type of imaging exam (e.g., X-ray, CT)
      findings?: string; // Summary of the findings
      impression?: string; // Interpretation or impression notes
      performedAt?: Date; // Time when the exam was performed
    }>;
  };

  // Risk assessments that flag potential hazards
  riskAssessments?: {
    fallRisk?: string; // Fall risk (e.g., "low", "moderate", "high")
    pressureUlcerRisk?: string; // Pressure ulcer risk (e.g., scale score)
  };

  // Documentation of any patient or family education provided
  educationProvided?: string;

  // Psychosocial and behavioral observations
  psychosocial?: string;

  // Communication or handoff notes with care team members
  communication?: string;

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
    medications: [
      {
        medicationName: { type: String, default: "" },
        dose: { type: String, default: "" },
        route: { type: String, default: "" },
        timeAdministered: { type: Date },
        response: { type: String, default: "" },
      },
    ],
    interventions: [
      {
        description: { type: String, default: "" },
        performedAt: { type: Date },
        outcome: { type: String, default: "" },
      },
    ],
    diagnostics: {
      labs: [
        {
          testName: { type: String, default: "" },
          result: { type: String, default: "" },
          unit: { type: String, default: "" },
          referenceRange: { type: String, default: "" },
          collectedAt: { type: Date },
        },
      ],
      imaging: [
        {
          examName: { type: String, default: "" },
          findings: { type: String, default: "" },
          impression: { type: String, default: "" },
          performedAt: { type: Date },
        },
      ],
    },
    riskAssessments: {
      fallRisk: { type: String, default: "" },
      pressureUlcerRisk: { type: String, default: "" },
    },
    educationProvided: { type: String, default: "" },
    psychosocial: { type: String, default: "" },
    communication: { type: String, default: "" },
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
const Entry = mongoose.model<IEntry>("Entry", EntrySchema, "emr_entries");

export default Entry;
