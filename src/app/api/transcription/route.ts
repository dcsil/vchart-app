import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { transcript } = await req.json();

  // TODO: Implement further processing and database storage
  console.log("Received transcript:", transcript);

  return NextResponse.json({ message: "Transcript received" });
}

export async function OPTIONS() {
  return NextResponse.json({ message: "Options request" }, { status: 204 });
}
