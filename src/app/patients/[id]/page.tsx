"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { log } from "@/app/utils/log";

// Patient interface
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

export default function PatientDetails() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [entriesError, setEntriesError] = useState("");
  
  // Fetch patient details
  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch patient details from API
        const response = await fetch(`/api/patients?id=${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient details');
        }
        
        const data = await response.json();
        
        // Find the patient in the returned data
        if (data.patients && Array.isArray(data.patients)) {
          const foundPatient = data.patients.find((p: Patient) => p._id === patientId);
          if (foundPatient) {
            setPatient(foundPatient);
          } else {
            throw new Error('Patient not found');
          }
        } else if (data.patient) {
          setPatient(data.patient);
        } else {
          throw new Error('Patient not found');
        }
      } catch (err) {
        log('Error fetching patient details: ' + err, 'error');
        setError('Could not load patient details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  // Fetch patient entries
  useEffect(() => {
    const fetchPatientEntries = async () => {
      if (!patientId) return;
      
      try {
        setEntriesLoading(true);
        
        // Fetch entries from API
        const response = await fetch(`/api/entries?patientId=${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient entries');
        }
        
        const data = await response.json();
        setEntries(data.entries || []);
      } catch (err) {
        log('Error fetching patient entries: ' + err, 'error');
        setEntriesError('Failed to load patient entries');
      } finally {
        setEntriesLoading(false);
      }
    };
    
    fetchPatientEntries();
  }, [patientId]);

  const handleBack = () => {
    router.back();
  };

  const handleViewEntry = (entryId: string) => {
    log(`View entry ${entryId}`, 'info');
    router.push(`/patients/${patientId}/entries/${entryId}`);
  };

  const handleAddEntry = () => {
    log('Add new entry', 'info');
    router.push(`/patients/${patientId}/new-entry`);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy - h:mm a");
    } catch (error) {
      return dateString;
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
        Back to Patient List
      </button>

      {/* Main Content Container */}
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-1">
        {/* Loading and Error States */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B52FF]"></div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : patient ? (
          <>
            {/* Patient Info Section */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                {patient.firstName} {patient.lastName}
              </h1>
              
              <div className="flex flex-wrap items-center bg-gray-50 p-3 rounded-md">
                <div className="flex items-center mr-6">
                  <span className="text-sm text-gray-500 mr-2">Room:</span>
                  <span className="font-medium">{patient.roomNumber}</span>
                </div>
                <div className="flex items-center mt-1 md:mt-0">
                  <span className="text-sm text-gray-500 mr-2">Diagnosis:</span>
                  <span className="font-medium">{patient.diagnosis}</span>
                </div>
              </div>
            </div>
            
            {/* History Section */}
            <div className="bg-white shadow-md rounded-lg p-6 flex flex-col flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">History</h2>
              
              {/* Scrollable Entries List */}
              <div className="flex-1 overflow-hidden mb-4">
                {entriesLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B52FF]"></div>
                  </div>
                ) : entriesError ? (
                  <div className="text-center p-4 text-red-500">
                    {entriesError}
                  </div>
                ) : entries.length > 0 ? (
                  <div className="h-full overflow-y-auto pr-2 space-y-3">
                    {entries.map((entry) => (
                      <div key={entry._id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <p className="font-bold text-gray-800 mr-3">
                            {formatDate(entry.createdAt)}
                          </p>
                          {!entry.reviewed && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mt-1 sm:mt-0">
                              Pending Review
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleViewEntry(entry._id)}
                          className="px-4 py-1.5 bg-[#8B52FF] text-white rounded-md hover:bg-opacity-90 transition-colors text-sm"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center">
                    <p className="text-gray-500">No entries available for this patient</p>
                  </div>
                )}
              </div>
              
              {/* Add Entry Button */}
              <button
                onClick={handleAddEntry}
                className="w-full py-3 px-4 bg-[#8B52FF] text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors shadow-md flex items-center justify-center"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Entry
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-gray-500">Patient not found</p>
          </div>
        )}
      </div>
    </div>
  );
} 