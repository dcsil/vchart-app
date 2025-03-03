import connectToDatabase from "@/lib/mongodb";

export async function GET() {
  try {
    await connectToDatabase();
    return Response.json({ message: "Connected to MongoDB!" });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
