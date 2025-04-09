// api/cohere/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { transcript } = body;

  if (!transcript) {
    return NextResponse.json(
      { error: "Transcript is required." },
      { status: 400 }
    );
  }

  const cohereApiKey = process.env.COHERE_API_KEY;
  if (!cohereApiKey) {
    return NextResponse.json(
      { error: "Cohere API key not set." },
      { status: 500 }
    );
  }

  const message = `Generate a JSON object from the following transcript of a nurse by extracting the following fields into a structured format.

Vital Signs:
  - temperature: an object with "value" (string) and "unit" (string, e.g. "C" or "F")
  - bloodPressure: an object with "systolic" (string), "diastolic" (string), and "unit" (should be "mmHg")
  - heartRate: string representing pulse rate in bpm
  - respiratoryRate: string representing breaths per minute
  - oxygenSaturation: string representing oxygen saturation as a percentage

Subjective:
  - chiefComplaint: string describing the patient's primary complaint
  - symptomHistory: string detailing the onset, duration, and progression of symptoms
  - painLevel: string representing pain level from 0 to 10

Objective:
  - generalAppearance: string describing the patient's overall appearance
  - cardiovascular: string with cardiovascular exam findings
  - respiratory: string with respiratory exam findings
  - neurological: string with neurological exam findings
  - skin: string describing the skin exam
  - additionalExam: string for any extra exam findings

Assessment & Plan:
  - assessment: string summarizing the nurse's clinical assessment
  - plan: string outlining the management or treatment plan

If any field is not mentioned in the transcript, return it as an empty string.

Transcript:
<transcript>
${transcript}
</transcript>`;

  const response = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cohereApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      response_format: {
        type: "json_object",
        schema: {
          type: "object",
          properties: {
            vitalSigns: {
              type: "object",
              properties: {
                temperature: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    unit: { type: "string" },
                  },
                  required: ["value", "unit"],
                },
                bloodPressure: {
                  type: "object",
                  properties: {
                    systolic: { type: "string" },
                    diastolic: { type: "string" },
                    unit: { type: "string", default: "mmHg" },
                  },
                  required: ["systolic", "diastolic", "unit"],
                },
                heartRate: { type: "string" },
                respiratoryRate: { type: "string" },
                oxygenSaturation: { type: "string" },
              },
              required: [
                "temperature",
                "bloodPressure",
                "heartRate",
                "respiratoryRate",
                "oxygenSaturation",
              ],
            },
            subjective: {
              type: "object",
              properties: {
                chiefComplaint: { type: "string" },
                symptomHistory: { type: "string" },
                painLevel: { type: "string" },
              },
              required: ["chiefComplaint", "symptomHistory", "painLevel"],
            },
            objective: {
              type: "object",
              properties: {
                generalAppearance: { type: "string" },
                cardiovascular: { type: "string" },
                respiratory: { type: "string" },
                neurological: { type: "string" },
                skin: { type: "string" },
                additionalExam: { type: "string" },
              },
              required: [
                "generalAppearance",
                "cardiovascular",
                "respiratory",
                "neurological",
                "skin",
                "additionalExam",
              ],
            },
            assessment: { type: "string" },
            plan: { type: "string" },
          },
          required: [
            "vitalSigns",
            "subjective",
            "objective",
            "assessment",
            "plan",
          ],
        },
      },
      temperature: 0.3,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: data.message || "Cohere API error" },
      { status: response.status }
    );
  }

  return NextResponse.json(data);
}
