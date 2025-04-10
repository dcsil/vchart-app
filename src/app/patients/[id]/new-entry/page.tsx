"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { log } from "@/app/utils/log";
import { useTranscription } from "@/app/hooks/useTranscription";
import { Mic, MicOff, Loader2 } from "lucide-react";

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

  // ---------- Vital Signs ----------
  const [temperature, setTemperature] = useState("");
  const [temperatureUnit, setTemperatureUnit] = useState("C");
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");

  // ---------- Subjective (Patient-Reported) ----------
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptomHistory, setSymptomHistory] = useState("");
  const [painLevel, setPainLevel] = useState("");

  // ---------- Objective (Physical Exam) ----------
  const [generalAppearance, setGeneralAppearance] = useState("");
  const [cardiovascular, setCardiovascular] = useState("");
  const [objRespiratory, setObjRespiratory] = useState("");
  const [neurological, setNeurological] = useState("");
  const [skin, setSkin] = useState("");
  const [additionalExam, setAdditionalExam] = useState("");

  // ---------- Assessment & Plan ----------
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

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

          // Update Vital Signs section
          if (parsed.vitalSigns) {
            const {
              temperature,
              bloodPressure,
              heartRate,
              respiratoryRate,
              oxygenSaturation,
            } = parsed.vitalSigns;
            if (temperature) {
              if (temperature.value) setTemperature(String(temperature.value));
              if (temperature.unit) setTemperatureUnit(temperature.unit);
            }
            if (bloodPressure) {
              if (bloodPressure.systolic)
                setBloodPressureSystolic(String(bloodPressure.systolic));
              if (bloodPressure.diastolic)
                setBloodPressureDiastolic(String(bloodPressure.diastolic));
            }
            if (heartRate) setHeartRate(String(heartRate));
            if (respiratoryRate) setRespiratoryRate(String(respiratoryRate));
            if (oxygenSaturation) setOxygenSaturation(String(oxygenSaturation));
          }

          // Update Subjective section
          if (parsed.subjective) {
            const { chiefComplaint, symptomHistory, painLevel } =
              parsed.subjective;
            if (chiefComplaint) setChiefComplaint(chiefComplaint);
            if (symptomHistory) setSymptomHistory(symptomHistory);
            if (painLevel) setPainLevel(String(painLevel));
          }

          // Update Objective section
          if (parsed.objective) {
            const {
              generalAppearance,
              cardiovascular,
              respiratory,
              neurological,
              skin,
              additionalExam,
            } = parsed.objective;
            if (generalAppearance) setGeneralAppearance(generalAppearance);
            if (cardiovascular) setCardiovascular(cardiovascular);
            if (respiratory) setObjRespiratory(respiratory); // Note: updating our objective respiratory state variable
            if (neurological) setNeurological(neurological);
            if (skin) setSkin(skin);
            if (additionalExam) setAdditionalExam(additionalExam);
          }

          // Update Assessment & Plan section
          if (parsed.assessment) setAssessment(parsed.assessment);
          if (parsed.plan) setPlan(parsed.plan);
        } catch (error) {
          log("Error parsing Cohere response:" + error, "error");
        }
      }
    }, 1500);

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

      // Build payload with nested objects as required by the new model
      const payload = {
        patientId,
        vitalSigns: {
          temperature: {
            value: parseFloat(temperature),
            unit: temperatureUnit,
          },
          bloodPressure: {
            systolic: parseFloat(bloodPressureSystolic),
            diastolic: parseFloat(bloodPressureDiastolic),
            unit: "mmHg",
          },
          heartRate: parseFloat(heartRate),
          respiratoryRate: parseFloat(respiratoryRate),
          oxygenSaturation: parseFloat(oxygenSaturation),
        },
        subjective: {
          chiefComplaint,
          symptomHistory,
          painLevel: painLevel ? parseInt(painLevel, 10) : undefined,
        },
        objective: {
          generalAppearance,
          cardiovascular,
          respiratory: objRespiratory,
          neurological,
          skin,
          additionalExam,
        },
        assessment,
        plan,
      };

      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 flex-1">
        {/* Form Container */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">New Entry</h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Vital Signs Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Vital Signs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Temperature with Unit */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="temperature"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Temperature
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="temperature"
                      type="text"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="e.g., 37.0"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                    <select
                      value={temperatureUnit}
                      onChange={(e) => setTemperatureUnit(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      aria-label="Temperature unit"
                    >
                      <option value="C">°C</option>
                      <option value="F">°F</option>
                    </select>
                  </div>
                </div>
                {/* Blood Pressure */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    id="bp-label"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Blood Pressure
                  </label>
                  <div
                    className="flex gap-2"
                    role="group"
                    aria-labelledby="bp-label"
                  >
                    <input
                      aria-label="Systolic Blood Pressure"
                      type="text"
                      value={bloodPressureSystolic}
                      onChange={(e) => setBloodPressureSystolic(e.target.value)}
                      placeholder="Systolic"
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                    <span className="self-center text-gray-500">/</span>
                    <input
                      aria-label="Diastolic Blood Pressure"
                      type="text"
                      value={bloodPressureDiastolic}
                      onChange={(e) =>
                        setBloodPressureDiastolic(e.target.value)
                      }
                      placeholder="Diastolic"
                      className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                  </div>
                </div>
                {/* Heart Rate */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="heartRate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Heart Rate (BPM)
                  </label>
                  <input
                    id="heartRate"
                    type="text"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="e.g., 75"
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
                    id="respiratoryRate"
                    type="text"
                    value={respiratoryRate}
                    onChange={(e) => setRespiratoryRate(e.target.value)}
                    placeholder="e.g., 16"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Oxygen Saturation */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="oxygenSaturation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Oxygen Saturation (%)
                  </label>
                  <input
                    id="oxygenSaturation"
                    type="text"
                    value={oxygenSaturation}
                    onChange={(e) => setOxygenSaturation(e.target.value)}
                    placeholder="e.g., 98"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
              </div>
            </section>

            {/* Subjective Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Subjective</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Chief Complaint */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="chiefComplaint"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Chief Complaint
                  </label>
                  <input
                    id="chiefComplaint"
                    type="text"
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    placeholder="e.g., Chest pain"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Symptom History */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="symptomHistory"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Symptom History
                  </label>
                  <textarea
                    id="symptomHistory"
                    value={symptomHistory}
                    onChange={(e) => setSymptomHistory(e.target.value)}
                    placeholder="e.g., Started suddenly 2 hours ago..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Pain Level */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="painLevel"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pain Level (0-10)
                  </label>
                  <input
                    id="painLevel"
                    type="text"
                    value={painLevel}
                    onChange={(e) => setPainLevel(e.target.value)}
                    placeholder="e.g., 3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
              </div>
            </section>

            {/* Objective Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Objective</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* General Appearance */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="generalAppearance"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    General Appearance
                  </label>
                  <textarea
                    id="generalAppearance"
                    value={generalAppearance}
                    onChange={(e) => setGeneralAppearance(e.target.value)}
                    placeholder="e.g., Patient appears alert but in mild distress..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Cardiovascular */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="cardiovascular"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cardiovascular Exam
                  </label>
                  <textarea
                    id="cardiovascular"
                    value={cardiovascular}
                    onChange={(e) => setCardiovascular(e.target.value)}
                    placeholder="e.g., Regular rhythm, no murmurs..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Respiratory */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="objRespiratory"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Respiratory Exam
                  </label>
                  <textarea
                    id="objRespiratory"
                    value={objRespiratory}
                    onChange={(e) => setObjRespiratory(e.target.value)}
                    placeholder="e.g., Clear to auscultation..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Neurological */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="neurological"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Neurological Exam
                  </label>
                  <textarea
                    id="neurological"
                    value={neurological}
                    onChange={(e) => setNeurological(e.target.value)}
                    placeholder="e.g., Patient is oriented x3..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Skin Exam */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="skin"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Skin Exam
                  </label>
                  <textarea
                    id="skin"
                    value={skin}
                    onChange={(e) => setSkin(e.target.value)}
                    placeholder="e.g., No rashes or lesions observed..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Additional Exam */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="additionalExam"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Additional Exam
                  </label>
                  <textarea
                    id="additionalExam"
                    value={additionalExam}
                    onChange={(e) => setAdditionalExam(e.target.value)}
                    placeholder="Any extra observations..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
              </div>
            </section>

            {/* Assessment & Plan Section */}
            <section>
              <h2 className="text-xl font-semibold mb-4">Assessment & Plan</h2>
              <div className="grid grid-cols-1 gap-4">
                {/* Assessment */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="assessment"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Assessment
                  </label>
                  <textarea
                    id="assessment"
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Nurse's analysis of the situation..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
                {/* Plan */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <label
                    htmlFor="plan"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Plan
                  </label>
                  <textarea
                    id="plan"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Next steps for patient care..."
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
              </div>
            </section>

            {/* Action Buttons with Mic Button */}
            <div className="mt-6 flex justify-around items-center">
              <button
                type="button"
                onClick={handleMicrophoneClick}
                className={`p-4 rounded-full transition-colors ${
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
                className={`px-8 py-4 rounded-lg font-medium text-white text-lg shadow-md transition-colors ${
                  isSubmitting
                    ? "bg-gray-400"
                    : "bg-[#8B52FF] hover:bg-opacity-90"
                }`}
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
          <div className="overflow-auto p-2 border border-gray-300 rounded-md flex-1 bg-white shadow-sm min-h-[17vh]">
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
