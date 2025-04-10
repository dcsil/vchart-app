"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { log } from "@/app/utils/log";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  diagnosis: string;
}

interface Entry {
  _id: string;
  patientId: string;
  vitalSigns: {
    temperature: { value: string; unit: string };
    bloodPressure: { systolic: string; diastolic: string; unit: string };
    heartRate: string;
    respiratoryRate: string;
    oxygenSaturation: string;
  };
  subjective: {
    chiefComplaint: string;
    symptomHistory: string;
    painLevel: string;
  };
  objective: {
    generalAppearance: string;
    cardiovascular: string;
    respiratory: string;
    neurological: string;
    skin: string;
    additionalExam: string;
  };
  assessment: string;
  plan: string;
  reviewed: boolean;
  createdAt: string;
}

interface EntryUpdatePayload {
  id: string;
  vitalSigns?: {
    temperature?: { value?: string; unit?: string };
    bloodPressure?: { systolic?: string; diastolic?: string; unit?: string };
    heartRate?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
  };
  subjective?: {
    chiefComplaint?: string;
    symptomHistory?: string;
    painLevel?: string;
  };
  objective?: {
    generalAppearance?: string;
    cardiovascular?: string;
    respiratory?: string;
    neurological?: string;
    skin?: string;
    additionalExam?: string;
  };
  assessment?: string;
  plan?: string;
  reviewed?: boolean;
}

export default function EntryDetails() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const entryId = params.entryId as string;

  // Entry and patient state
  const [entry, setEntry] = useState<Entry | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------- Vital Signs State ----------
  const [temperature, setTemperature] = useState("");
  const [temperatureUnit, setTemperatureUnit] = useState("");
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");

  // ---------- Subjective State ----------
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [symptomHistory, setSymptomHistory] = useState("");
  const [painLevel, setPainLevel] = useState("");

  // ---------- Objective State ----------
  const [generalAppearance, setGeneralAppearance] = useState("");
  const [cardiovascular, setCardiovascular] = useState("");
  const [objRespiratory, setObjRespiratory] = useState("");
  const [neurological, setNeurological] = useState("");
  const [skin, setSkin] = useState("");
  const [additionalExam, setAdditionalExam] = useState("");

  // ---------- Assessment & Plan ----------
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");

  // Reviewed state and saving/exporting flags
  const [reviewed, setReviewed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fetch entry and patient data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch patient details (needed for PDF export)
        const patientResponse = await fetch(`/api/patients?id=${patientId}`);
        if (!patientResponse.ok) {
          throw new Error("Failed to fetch patient details");
        }
        const patientData = await patientResponse.json();
        if (patientData.patient) {
          setPatient(patientData.patient);
        } else {
          log(
            "Patient not found in response: " + JSON.stringify(patientData),
            "warn"
          );
        }

        // Fetch entry details
        const entryResponse = await fetch(`/api/entries?id=${entryId}`);
        if (!entryResponse.ok) {
          throw new Error("Failed to fetch entry details");
        }
        const entryData = await entryResponse.json();
        if (entryData.entry) {
          setEntry(entryData.entry);
          // Set form state from the entry (new model)
          // Vital Signs:
          setTemperature(entryData.entry.vitalSigns.temperature.value);
          setTemperatureUnit(entryData.entry.vitalSigns.temperature.unit);
          setBloodPressureSystolic(
            entryData.entry.vitalSigns.bloodPressure.systolic
          );
          setBloodPressureDiastolic(
            entryData.entry.vitalSigns.bloodPressure.diastolic
          );
          setHeartRate(entryData.entry.vitalSigns.heartRate);
          setRespiratoryRate(entryData.entry.vitalSigns.respiratoryRate);
          setOxygenSaturation(entryData.entry.vitalSigns.oxygenSaturation);
          // Subjective:
          setChiefComplaint(entryData.entry.subjective.chiefComplaint);
          setSymptomHistory(entryData.entry.subjective.symptomHistory);
          setPainLevel(entryData.entry.subjective.painLevel);
          // Objective:
          setGeneralAppearance(entryData.entry.objective.generalAppearance);
          setCardiovascular(entryData.entry.objective.cardiovascular);
          setObjRespiratory(entryData.entry.objective.respiratory);
          setNeurological(entryData.entry.objective.neurological);
          setSkin(entryData.entry.objective.skin);
          setAdditionalExam(entryData.entry.objective.additionalExam);
          // Assessment & Plan:
          setAssessment(entryData.entry.assessment);
          setPlan(entryData.entry.plan);

          setReviewed(entryData.entry.reviewed);
        } else {
          throw new Error("Entry not found");
        }
      } catch (err) {
        log("Error fetching details: " + err, "error");
        setError("Could not load entry details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (patientId && entryId) {
      fetchData();
    }
  }, [patientId, entryId]);

  const handleBack = () => {
    router.back();
  };

  const handleToggleReviewed = async () => {
    if (!entry) return;

    try {
      setIsSaving(true);
      setSaveError("");

      // Build payload using the new nested structure.
      const payload: EntryUpdatePayload = {
        id: entryId,
        reviewed: !reviewed,
      };

      // When marking as reviewed, include current form values
      if (!reviewed) {
        payload.vitalSigns = {
          temperature: { value: temperature, unit: temperatureUnit },
          bloodPressure: {
            systolic: bloodPressureSystolic,
            diastolic: bloodPressureDiastolic,
            unit: "mmHg",
          },
          heartRate,
          respiratoryRate,
          oxygenSaturation,
        };
        payload.subjective = {
          chiefComplaint,
          symptomHistory,
          painLevel,
        };
        // Ensure all objective fields are strings (defaulting to empty string if falsy)
        payload.objective = {
          generalAppearance: generalAppearance || "",
          cardiovascular: cardiovascular || "",
          respiratory: objRespiratory || "",
          neurological: neurological || "",
          skin: skin || "",
          additionalExam: additionalExam || "",
        };
        payload.assessment = assessment;
        payload.plan = plan;
      }

      // Update reviewed status and save form data
      const response = await fetch("/api/entries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update review status");
      }

      // Update local state
      setReviewed(!reviewed);
      // Merge updated data into the local entry
      setEntry({
        ...entry,
        reviewed: !reviewed,
        vitalSigns: payload.vitalSigns
          ? {
              temperature: {
                value: payload.vitalSigns.temperature?.value || "",
                unit: payload.vitalSigns.temperature?.unit || "",
              },
              bloodPressure: {
                systolic: payload.vitalSigns.bloodPressure?.systolic || "",
                diastolic: payload.vitalSigns.bloodPressure?.diastolic || "",
                unit: payload.vitalSigns.bloodPressure?.unit || "",
              },
              heartRate: payload.vitalSigns.heartRate || "",
              respiratoryRate: payload.vitalSigns.respiratoryRate || "",
              oxygenSaturation: payload.vitalSigns.oxygenSaturation || "",
            }
          : entry.vitalSigns,
        subjective: payload.subjective
          ? {
              chiefComplaint: payload.subjective.chiefComplaint || "",
              symptomHistory: payload.subjective.symptomHistory || "",
              painLevel: payload.subjective.painLevel || "",
            }
          : entry.subjective,
        objective: payload.objective
          ? {
              generalAppearance: payload.objective.generalAppearance || "",
              cardiovascular: payload.objective.cardiovascular || "",
              respiratory: payload.objective.respiratory || "",
              neurological: payload.objective.neurological || "",
              skin: payload.objective.skin || "",
              additionalExam: payload.objective.additionalExam || "",
            }
          : entry.objective,
        assessment: payload.assessment || entry.assessment,
        plan: payload.plan || entry.plan,
      });
      log("Entry updated successfully", "info");
    } catch (err: unknown) {
      log(
        "Error updating entry: " +
          (err instanceof Error ? err.message : String(err)),
        "error"
      );
      setSaveError(
        err instanceof Error
          ? err.message
          : "Failed to update. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy - h:mm a");
    } catch (error) {
      log("Error formatting date: " + error, "error");
      return dateString;
    }
  };

  const handleExport = async () => {
    if (!entry || !patient || !reviewed) return;

    try {
      setIsExporting(true);
      const doc = new jsPDF();
      let yPos = 20;

      // ===============================================================
      // Header Section
      // ===============================================================
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text("Patient Health Record", 105, yPos, { align: "center" });

      // ===============================================================
      // Patient Information Section
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Patient Information:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Name:", 25, yPos);
      doc.text(`${patient.firstName} ${patient.lastName}`, 100, yPos);
      yPos += 6;
      doc.text("Room Number:", 25, yPos);
      doc.text(patient.roomNumber, 100, yPos);
      yPos += 6;
      doc.text("Diagnosis:", 25, yPos);
      // Wrap Diagnosis text if too long
      const diagLines = doc.splitTextToSize(patient.diagnosis, 90);
      doc.text(diagLines, 100, yPos);
      yPos += diagLines.length * 6;

      // ===============================================================
      // EMR Entry Details Section
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("EMR Entry Details:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Date:", 25, yPos);
      doc.text(formatDate(entry.createdAt), 100, yPos);

      // ===============================================================
      // Vital Signs Section (Table Format)
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Vital Signs:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Temperature:", 25, yPos);
      doc.text(
        `${entry.vitalSigns.temperature.value} °${entry.vitalSigns.temperature.unit}`,
        100,
        yPos
      );
      yPos += 8;
      doc.text("Blood Pressure:", 25, yPos);
      doc.text(
        `${entry.vitalSigns.bloodPressure.systolic}/${entry.vitalSigns.bloodPressure.diastolic} ${entry.vitalSigns.bloodPressure.unit}`,
        100,
        yPos
      );
      yPos += 8;
      doc.text("Pulse Rate:", 25, yPos);
      doc.text(`${entry.vitalSigns.heartRate} bpm`, 100, yPos);
      yPos += 8;
      doc.text("Respiratory Rate:", 25, yPos);
      doc.text(`${entry.vitalSigns.respiratoryRate} breaths/minute`, 100, yPos);
      yPos += 8;
      doc.text("Oxygen Saturation:", 25, yPos);
      doc.text(`${entry.vitalSigns.oxygenSaturation} %`, 100, yPos);

      // ===============================================================
      // Subjective Section (Table Format)
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Subjective:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Chief Complaint:", 25, yPos);
      doc.text(entry.subjective.chiefComplaint, 100, yPos);
      yPos += 8;
      doc.text("Symptom History:", 25, yPos);
      // Wrap Symptom History text
      const sympLines = doc.splitTextToSize(
        entry.subjective.symptomHistory,
        90
      );
      doc.text(sympLines, 100, yPos);
      yPos += sympLines.length * 6;
      doc.text("Pain Level:", 25, yPos);
      doc.text(`${entry.subjective.painLevel}/10`, 100, yPos);

      // ===============================================================
      // Objective Section (Table Format)
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Objective:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("General Appearance:", 25, yPos);
      const genAppLines = doc.splitTextToSize(
        entry.objective.generalAppearance,
        90
      );
      doc.text(genAppLines, 100, yPos);
      yPos += genAppLines.length * 6;
      doc.text("Cardiovascular:", 25, yPos);
      const cardioLines = doc.splitTextToSize(
        entry.objective.cardiovascular,
        90
      );
      doc.text(cardioLines, 100, yPos);
      yPos += cardioLines.length * 6;
      doc.text("Respiratory:", 25, yPos);
      const objRespLines = doc.splitTextToSize(entry.objective.respiratory, 90);
      doc.text(objRespLines, 100, yPos);
      yPos += objRespLines.length * 6;
      doc.text("Neurological:", 25, yPos);
      const neuroLines = doc.splitTextToSize(entry.objective.neurological, 90);
      doc.text(neuroLines, 100, yPos);
      yPos += neuroLines.length * 6;
      doc.text("Skin:", 25, yPos);
      const skinLines = doc.splitTextToSize(entry.objective.skin, 90);
      doc.text(skinLines, 100, yPos);
      yPos += skinLines.length * 6;
      doc.text("Additional Exam:", 25, yPos);
      const addExamLines = doc.splitTextToSize(
        entry.objective.additionalExam,
        90
      );
      doc.text(addExamLines, 100, yPos);
      yPos += addExamLines.length * 6;

      // ===============================================================
      // Assessment & Plan Section (Table Format)
      // ===============================================================
      yPos += 10;
      doc.setFontSize(14);
      doc.text("Assessment & Plan:", 20, yPos);
      yPos += 2;
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      doc.setFontSize(12);
      doc.text("Assessment:", 25, yPos);
      const assessLines = doc.splitTextToSize(entry.assessment, 90);
      doc.text(assessLines, 100, yPos);
      yPos += assessLines.length * 6;
      doc.text("Plan:", 25, yPos);
      const planLines = doc.splitTextToSize(entry.plan, 90);
      doc.text(planLines, 100, yPos);
      yPos += planLines.length * 6;

      // ===============================================================
      // Footer Section (Review Confirmation & Timestamp)
      // ===============================================================
      yPos += 20;
      doc.setFontSize(12);
      doc.text("This record has been reviewed and approved.", 20, yPos);
      yPos += 6;
      doc.text(
        `Report generated: ${format(new Date(), "MMMM d, yyyy - h:mm a")}`,
        20,
        yPos
      );

      // ===============================================================
      // Save PDF File
      // ===============================================================
      doc.save(
        `${patient.lastName}_${patient.firstName}_EMR_${format(
          new Date(),
          "yyyyMMdd"
        )}.pdf`
      );
      log("PDF export completed successfully", "info");
    } catch (err) {
      log("Error generating PDF: " + err, "error");
      setSaveError("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
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

      {/* Main Content Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          EMR Entry {reviewed ? "(Reviewed)" : "(Unreviewed)"}
        </h1>

        {/* Error Message */}
        {(error || saveError) && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error || saveError}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B52FF]"></div>
          </div>
        ) : entry ? (
          <>
            {/* Form Sections */}
            <div className="flex-1 flex flex-col space-y-6 overflow-auto pr-2">
              {/* Vital Signs Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Vital Signs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Temperature */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label
                      htmlFor="temperature"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Temperature
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="temperature"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value)}
                        disabled={reviewed}
                        className={`w-full p-2 border border-gray-300 rounded-md ${
                          reviewed
                            ? "bg-gray-100"
                            : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                        }`}
                      />
                      <select
                        id="temperatureUnit"
                        value={temperatureUnit}
                        onChange={(e) => setTemperatureUnit(e.target.value)}
                        disabled={reviewed}
                        className={`w-20 p-2 border border-gray-300 rounded-md ${
                          reviewed
                            ? "bg-gray-100 cursor-not-allowed"
                            : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                        }`}
                      >
                        <option value="C">°C</option>
                        <option value="F">°F</option>
                      </select>
                    </div>
                  </div>

                  {/* Blood Pressure */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label
                      htmlFor="bloodPressure"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Blood Pressure
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="bpSystolic"
                        value={bloodPressureSystolic}
                        onChange={(e) =>
                          setBloodPressureSystolic(e.target.value)
                        }
                        disabled={reviewed}
                        placeholder="Systolic"
                        className={`w-1/2 p-2 border border-gray-300 rounded-md ${
                          reviewed
                            ? "bg-gray-100"
                            : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                        }`}
                      />
                      <input
                        type="text"
                        id="bpDiastolic"
                        value={bloodPressureDiastolic}
                        onChange={(e) =>
                          setBloodPressureDiastolic(e.target.value)
                        }
                        disabled={reviewed}
                        placeholder="Diastolic"
                        className={`w-1/2 p-2 border border-gray-300 rounded-md ${
                          reviewed
                            ? "bg-gray-100"
                            : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                        }`}
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
                      type="text"
                      id="heartRate"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      type="text"
                      id="oxygenSaturation"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      type="text"
                      id="chiefComplaint"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      rows={3}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      type="text"
                      id="painLevel"
                      value={painLevel}
                      onChange={(e) => setPainLevel(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
                    />
                  </div>

                  {/* Cardiovascular Exam */}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
                    />
                  </div>

                  {/* Respiratory Exam */}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
                    />
                  </div>

                  {/* Neurological Exam */}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      rows={2}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
                    />
                  </div>
                </div>
              </section>

              {/* Assessment & Plan Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">
                  Assessment &amp; Plan
                </h2>
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
                      disabled={reviewed}
                      rows={3}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
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
                      disabled={reviewed}
                      rows={3}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed
                          ? "bg-gray-100"
                          : "focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                      }`}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between items-stretch">
              {/* Review Toggle Button */}
              <button
                type="button"
                onClick={handleToggleReviewed}
                disabled={isSaving}
                className={`flex flex-col justify-center px-6 py-3 rounded-lg font-medium text-white flex-1 sm:flex-initial sm:w-2/3 mr-2 ${
                  isSaving
                    ? "bg-gray-400"
                    : reviewed
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-500 hover:bg-green-600"
                } transition-colors shadow-md`}
              >
                {isSaving ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <span className="text-sm">Mark as</span>
                    <span>{reviewed ? "Unreviewed" : "Reviewed"}</span>
                  </>
                )}
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={handleExport}
                disabled={!reviewed || isExporting}
                className={`flex items-center justify-center px-5 py-3 rounded-lg font-medium text-white flex-1 sm:flex-initial sm:w-1/3 min-h-[64px] ${
                  !reviewed
                    ? "bg-gray-400 cursor-not-allowed"
                    : isExporting
                    ? "bg-[#8B52FF] bg-opacity-75"
                    : "bg-[#8B52FF] hover:bg-opacity-90"
                } transition-colors shadow-md`}
              >
                {isExporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-gray-500">Entry not found</p>
          </div>
        )}
      </div>
    </div>
  );
}
