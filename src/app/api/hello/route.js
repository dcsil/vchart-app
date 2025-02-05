import connectToDatabase from "@/lib/mongodb";

export async function GET(req) {
  await connectToDatabase();
  return Response.json({ message: "Connected to MongoDB!" });
}
