import { AssemblyAI, RealtimeTranscript } from "assemblyai";
import { NextRequest } from "next/server";

const apiKey = process.env.ASSEMBLYAI_API_KEY || "";
const SAMPLE_RATE = 16_000;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!req.body) {
    return new Response("No audio data provided", { status: 400 });
  }

  try {
    const client = new AssemblyAI({
      apiKey: apiKey,
    });

    const transcriber = client.realtime.transcriber({
      sampleRate: SAMPLE_RATE,
    });

    let transcript = "";

    transcriber.on("transcript", (event: RealtimeTranscript) => {
      if (!event.text) return;

      if (event.message_type === "FinalTranscript") {
        transcript = event.text;
      }
    });

    await transcriber.connect();

    const reader = req.body.getReader();
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        controller.enqueue(Buffer.from(chunk));
      },
    });

    const writableStream = transcriber.stream();

    const readableStream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    await readableStream.pipeThrough(transformStream).pipeTo(writableStream);

    await transcriber.close();

    return Response.json({ transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    return Response.json(
      { error: "Transcription failed", details: (error as Error).message },
      { status: 500 }
    );
  }
}
