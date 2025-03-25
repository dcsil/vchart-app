"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { log } from "@/app/utils/log";

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
  
  const handleBack = () => {
    router.back();
  };
  
  const handleMicrophoneClick = () => {
    log('Microphone clicked - voice recording feature to be implemented', 'debug');
    // Voice recording feature will be implemented later
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    if (!temperature || !bloodPressure || !pulseRate || 
        !respiratoryRate || !oxygenSaturation || !painLevel) {
      setError("All fields are required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError("");
      
      // Submit entry to API
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          temperature,
          bloodPressure,
          pulseRate,
          respiratoryRate,
          oxygenSaturation,
          painLevel
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save entry');
      }
      
      // On success, redirect back to patient details page
      router.push(`/patients/${patientId}`);
    } catch (err: unknown) {
      log('Error saving entry: ' + (err instanceof Error ? err.message : String(err)), 'error');
      setError(err instanceof Error ? err.message : 'Failed to save entry. Please try again.');
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Entry List
      </button>
      
      {/* Main Content Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col flex-1">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Entry</h1>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        {/* Form Container with Scrollable Area */}
        <div className="flex-1 flex flex-col">
          <form onSubmit={handleSubmit} className="flex flex-col flex-1">
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
                    placeholder="e.g., 98.6°F"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
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
                    placeholder="e.g., 120/80"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
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
                    placeholder="e.g., 75 bpm"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
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
                    placeholder="e.g., 16 breaths/min"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
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
                    placeholder="e.g., 98%"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
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
                    placeholder="e.g., 3/10"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                  />
                </div>
              </div>
            </div>
            
            {/* Bottom Action Bar */}
            <div className="mt-6 flex justify-around items-center">
              {/* Microphone Icon */}
              <button
                type="button"
                onClick={handleMicrophoneClick}
                className="p-4 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                aria-label="Voice recording"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              {/* Save Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-4 rounded-lg font-medium text-white text-lg ${
                  isSubmitting ? 'bg-gray-400' : 'bg-[#8B52FF] hover:bg-opacity-90'
                } transition-colors shadow-md`}
              >
                {isSubmitting ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 