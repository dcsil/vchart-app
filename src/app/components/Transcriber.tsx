import { useState } from "react";

export default function Transcriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob);

        const response = await fetch("/api/assemblyai", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.transcript) {
          console.log("Transcript:", data.transcript);
          setTranscript(data.transcript);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Stop recording after 5 seconds (for testing)
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      }, 5000);
    } catch (error) {
      console.error("Recording error:", error);
    }
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? "Recording..." : "Start Recording"}
      </button>
      {transcript && (
        <div>
          <h3>Transcript:</h3>
          <p>{transcript}</p>
        </div>
      )}
    </div>
  );
}
