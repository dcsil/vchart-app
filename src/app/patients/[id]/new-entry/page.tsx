"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { log } from "@/app/utils/log";
import { useTranscription } from "@/app/hooks/useTranscription";
import { Mic, MicOff, Loader2 } from "lucide-react";

// Helper function to call the Cohere endpoint
async function callCohereLLM(transcript: string) {
  try {
    const response = await fetch("/api/cohere", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch from Cohere");
    }
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Error in callCohereLLM:", error);
    return null;
  }
}

export default function NewEntry() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  // Form state
  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulseRate, setPulseRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [painLevel, setPainLevel] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Transcription state
  const {
    isListening,
    transcript,
    interimResult,
    startListening,
    stopListening,
  } = useTranscription();

  useEffect(() => {
    const fullText = `${transcript} ${interimResult}`.trim();
    if (!fullText) return;

    const timer = setTimeout(async () => {
      const cohereResponse = await callCohereLLM(fullText);
      if (cohereResponse) {
        try {
          const parsed = JSON.parse(cohereResponse);
          if (parsed.temperature) setTemperature(parsed.temperature);
          if (parsed.bloodPressure) setBloodPressure(parsed.bloodPressure);
          if (parsed.pulseRate) setPulseRate(parsed.pulseRate);
          if (parsed.respiratoryRate)
            setRespiratoryRate(parsed.respiratoryRate);
          if (parsed.oxygenSaturation)
            setOxygenSaturation(parsed.oxygenSaturation);
          if (parsed.painLevel) setPainLevel(parsed.painLevel);
        } catch (error) {
          console.error("Error parsing Cohere response:", error);
        }
      }
    }, 2000); // 2-second debounce

    return () => clearTimeout(timer);
  }, [transcript, interimResult]);

  const handleBack = () => {
    router.back();
  };

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId,
          temperature,
          bloodPressure,
          pulseRate,
          respiratoryRate,
          oxygenSaturation,
          painLevel,
          transcript: transcript,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save entry");
      }

      router.push(`/patients/${patientId}`);
    } catch (err: unknown) {
      log(
        "Error saving entry: " +
          (err instanceof Error ? err.message : String(err)),
        "error"
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save entry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-4 md:p-6">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Entry List
      </button>

      {/* Main Container*/}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 flex-1">
        {/* Form Container */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">New Entry</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="overflow-auto pr-2 space-y-4 h-[50vh] md:h-96">
              {/* Temperature */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="temperature"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Temperature
                </label>
                <input
                  type="text"
                  id="temperature"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="e.g., 98.6°F"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>

              {/* Blood Pressure */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="bloodPressure"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Blood Pressure
                </label>
                <input
                  type="text"
                  id="bloodPressure"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="e.g., 120/80"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>

              {/* Pulse Rate */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="pulseRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pulse Rate
                </label>
                <input
                  type="text"
                  id="pulseRate"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  placeholder="e.g., 75 bpm"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>

              {/* Respiratory Rate */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="respiratoryRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Respiratory Rate
                </label>
                <input
                  type="text"
                  id="respiratoryRate"
                  value={respiratoryRate}
                  onChange={(e) => setRespiratoryRate(e.target.value)}
                  placeholder="e.g., 16 breaths/min"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>

              {/* Oxygen Saturation */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="oxygenSaturation"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Oxygen Saturation
                </label>
                <input
                  type="text"
                  id="oxygenSaturation"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  placeholder="e.g., 98%"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>

              {/* Pain Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <label
                  htmlFor="painLevel"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Pain Level
                </label>
                <input
                  type="text"
                  id="painLevel"
                  value={painLevel}
                  onChange={(e) => setPainLevel(e.target.value)}
                  placeholder="e.g., 3/10"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                />
              </div>
            </div>

            {/* Action Buttons with Mic Button */}
            <div className="mt-6 flex justify-around items-center">
              <button
                type="button"
                onClick={handleMicrophoneClick}
                className={`p-4 rounded-full hover:bg-gray-200 transition-colors ${
                  isListening
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-[#8B52FF] hover:bg-opacity-90"
                }`}
                aria-label="Voice recording"
              >
                {isListening ? (
                  <MicOff className="h-7 w-7 text-white" />
                ) : (
                  <Mic className="h-7 w-7 text-white" />
                )}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-lg font-medium text-white text-lg ${
                  isSubmitting
                    ? "bg-gray-400"
                    : "bg-[#8B52FF] hover:bg-opacity-90"
                } transition-colors shadow-md`}
              >
                {isSubmitting ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </form>
        </div>

        {/* Transcription Box */}
        <div className="md:w-1/3 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-2 md:mb-4">
            Live Transcription
          </h2>
          <div className="overflow-auto p-2 border border-gray-300 rounded-md h-[17vh] md:h-96 bg-white shadow-sm">
            {transcript || interimResult ? (
              <p className="text-gray-700 whitespace-pre-wrap">
                {transcript}
                {interimResult && (
                  <span className="text-gray-500">
                    {transcript ? " " : ""}
                    {interimResult}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-gray-500 text-center">
                {isListening ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Listening...
                  </span>
                ) : (
                  "Transcript will appear here"
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
