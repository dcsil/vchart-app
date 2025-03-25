"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { log } from "@/app/utils/log";

// Patient interface needed for full info on export
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  diagnosis: string;
}

// Entry interface
interface Entry {
  _id: string;
  patientId: string;
  temperature: string;
  bloodPressure: string;
  pulseRate: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  painLevel: string;
  reviewed: boolean;
  createdAt: string;
}

// Interface for the update payload
interface EntryUpdatePayload {
  id: string;
  temperature?: string;
  bloodPressure?: string;
  pulseRate?: string;
  respiratoryRate?: string;
  oxygenSaturation?: string;
  painLevel?: string;
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
  
  // Form state
  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulseRate, setPulseRate] = useState("");
  const [respiratoryRate, setRespiratoryRate] = useState("");
  const [oxygenSaturation, setOxygenSaturation] = useState("");
  const [painLevel, setPainLevel] = useState("");
  const [reviewed, setReviewed] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveError, setSaveError] = useState("");
  
  // Fetch entry and patient data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch patient details first (needed for PDF export)
        const patientResponse = await fetch(`/api/patients?id=${patientId}`);
        
        if (!patientResponse.ok) {
          throw new Error('Failed to fetch patient details');
        }
        
        const patientData = await patientResponse.json();
        
        if (patientData.patient) {
          setPatient(patientData.patient);
        } else {
          log('Patient not found in response: ' + JSON.stringify(patientData), 'warn');
        }
        
        // Fetch entry details
        const entryResponse = await fetch(`/api/entries?id=${entryId}`);
        
        if (!entryResponse.ok) {
          throw new Error('Failed to fetch entry details');
        }
        
        const entryData = await entryResponse.json();
        
        if (entryData.entry) {
          setEntry(entryData.entry);
          
          // Set form state from entry data
          setTemperature(entryData.entry.temperature);
          setBloodPressure(entryData.entry.bloodPressure);
          setPulseRate(entryData.entry.pulseRate);
          setRespiratoryRate(entryData.entry.respiratoryRate);
          setOxygenSaturation(entryData.entry.oxygenSaturation);
          setPainLevel(entryData.entry.painLevel);
          setReviewed(entryData.entry.reviewed);
        } else {
          throw new Error('Entry not found');
        }
      } catch (err) {
        log('Error fetching details: ' + err, 'error');
        setError('Could not load entry details. Please try again later.');
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
      
      // Prepare payload with form data and review status
      const payload: EntryUpdatePayload = {
        id: entryId,
        reviewed: !reviewed
      };
      
      // If marking as reviewed, also save the current form values
      if (!reviewed) {
        payload.temperature = temperature;
        payload.bloodPressure = bloodPressure;
        payload.pulseRate = pulseRate;
        payload.respiratoryRate = respiratoryRate;
        payload.oxygenSaturation = oxygenSaturation;
        payload.painLevel = painLevel;
      }
      
      // Update reviewed status and save form data
      const response = await fetch('/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update review status');
      }
            
      // Update local state
      setReviewed(!reviewed);
      setEntry({
        ...entry,
        ...(payload as Partial<Entry>),
        reviewed: !reviewed
      });
      
      // Show success message (could add a toast here)
      log('Entry updated successfully', 'info');
    } catch (err: unknown) {
      log('Error updating entry: ' + (err instanceof Error ? err.message : String(err)), 'error');
      setSaveError(err instanceof Error ? err.message : 'Failed to update. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy - h:mm a");
    } catch (error) {
      log('Error formatting date: ' + error, 'error');
      return dateString;
    }
  };
  
  const handleExport = async () => {
    if (!entry || !patient || !reviewed) return;

    try {
      setIsExporting(true);
      
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add patient info
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text("Patient Health Record", 105, 20, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      
      // Basic Info Section
      doc.setFontSize(14);
      doc.setTextColor(33, 33, 33);
      doc.text("Patient Information:", 20, 40);
      
      doc.setFontSize(12);
      doc.text(`Name: ${patient.firstName} ${patient.lastName}`, 25, 50);
      doc.text(`Room Number: ${patient.roomNumber}`, 25, 60);
      doc.text(`Diagnosis: ${patient.diagnosis}`, 25, 70);
      
      // Entry specific info
      doc.setFontSize(14);
      doc.text("Vital Signs Record:", 20, 90);
      doc.setFontSize(12);
      doc.text(`Date: ${formatDate(entry.createdAt)}`, 25, 100);
      
      // Create a simple table for vitals
      let yPos = 110;
      
      // Table headers
      doc.setFontSize(11);
      doc.setDrawColor(200, 200, 200);
      doc.line(20, yPos, 190, yPos);
      yPos += 10;
      
      // Table content
      doc.text("Temperature:", 25, yPos);
      doc.text(entry.temperature, 100, yPos);
      yPos += 10;
      
      doc.text("Blood Pressure:", 25, yPos);
      doc.text(entry.bloodPressure, 100, yPos);
      yPos += 10;
      
      doc.text("Pulse Rate:", 25, yPos);
      doc.text(entry.pulseRate, 100, yPos);
      yPos += 10;
      
      doc.text("Respiratory Rate:", 25, yPos);
      doc.text(entry.respiratoryRate, 100, yPos);
      yPos += 10;
      
      doc.text("Oxygen Saturation:", 25, yPos);
      doc.text(entry.oxygenSaturation, 100, yPos);
      yPos += 10;
      
      doc.text("Pain Level:", 25, yPos);
      doc.text(entry.painLevel, 100, yPos);
      yPos += 10;
      
      doc.line(20, yPos, 190, yPos);
      
      // Add review confirmation
      yPos += 20;
      doc.text("This record has been reviewed and approved.", 20, yPos);
      
      // Add date stamp
      yPos += 10;
      doc.text(`Report generated: ${format(new Date(), "MMMM d, yyyy - h:mm a")}`, 20, yPos);
      
      // Save the PDF
      doc.save(`${patient.lastName}_${patient.firstName}_VitalSigns_${format(new Date(), "yyyyMMdd")}.pdf`);
      
      log('PDF export completed successfully', 'info');
    } catch (err) {
      log('Error generating PDF: ' + err, 'error');
      setSaveError('Failed to generate PDF. Please try again.');
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Entry List
      </button>
      
      {/* Main Content Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">
        {/* Title with Review Status */}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Entry {reviewed ? "(Reviewed)" : "(Unreviewed)"}
        </h1>
        
        {/* Error message */}
        {(error || saveError) && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error || saveError}
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B52FF]"></div>
          </div>
        ) : entry ? (
          <>
            {/* Form Container with Scrollable Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto pr-2 space-y-4">
                  {/* Temperature */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature
                    </label>
                    <input
                      type="text"
                      id="temperature"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                  
                  {/* Blood Pressure */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="bloodPressure" className="block text-sm font-medium text-gray-700 mb-1">
                      Blood Pressure
                    </label>
                    <input
                      type="text"
                      id="bloodPressure"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                  
                  {/* Pulse Rate */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="pulseRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Pulse Rate
                    </label>
                    <input
                      type="text"
                      id="pulseRate"
                      value={pulseRate}
                      onChange={(e) => setPulseRate(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                  
                  {/* Respiratory Rate */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="respiratoryRate" className="block text-sm font-medium text-gray-700 mb-1">
                      Respiratory Rate
                    </label>
                    <input
                      type="text"
                      id="respiratoryRate"
                      value={respiratoryRate}
                      onChange={(e) => setRespiratoryRate(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                  
                  {/* Oxygen Saturation */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="oxygenSaturation" className="block text-sm font-medium text-gray-700 mb-1">
                      Oxygen Saturation
                    </label>
                    <input
                      type="text"
                      id="oxygenSaturation"
                      value={oxygenSaturation}
                      onChange={(e) => setOxygenSaturation(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                  
                  {/* Pain Level */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <label htmlFor="painLevel" className="block text-sm font-medium text-gray-700 mb-1">
                      Pain Level
                    </label>
                    <input
                      type="text"
                      id="painLevel"
                      value={painLevel}
                      onChange={(e) => setPainLevel(e.target.value)}
                      disabled={reviewed}
                      className={`w-full p-2 border border-gray-300 rounded-md ${
                        reviewed ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B52FF]'
                      }`}
                    />
                  </div>
                </div>
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
                      ? 'bg-gray-400' 
                      : reviewed 
                        ? 'bg-amber-500 hover:bg-amber-600' 
                        : 'bg-green-500 hover:bg-green-600'
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
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : isExporting 
                        ? 'bg-[#8B52FF] bg-opacity-75' 
                        : 'bg-[#8B52FF] hover:bg-opacity-90'
                  } transition-colors shadow-md`}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
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