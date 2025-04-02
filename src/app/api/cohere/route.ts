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

  const message = `Generate a JSON object from the following transcript of a nurse-patient interaction by extracting these fields: temperature, bloodPressure, pulseRate, respiratoryRate, oxygenSaturation, and painLevel.\n\n<transcript>\n${transcript}\n</transcript>`;

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
            temperature: { type: "string" },
            bloodPressure: { type: "string" },
            pulseRate: { type: "string" },
            respiratoryRate: { type: "string" },
            oxygenSaturation: { type: "string" },
            painLevel: { type: "string" },
          },
          required: [
            "temperature",
            "bloodPressure",
            "pulseRate",
            "respiratoryRate",
            "oxygenSaturation",
            "painLevel",
          ],
        },
      },
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
