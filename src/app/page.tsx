"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { log } from "@/app/utils/log";

// Define patient interface
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  diagnosis: string;
}

export default function Home() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/patients');
        
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
        
        const data = await response.json();
        setPatients(data.patients || []);
      } catch (err) {
        log('Error fetching patients: ' + err, 'error');
        setError('Could not load patients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      // Redirect to login page
      router.push('/login');
      router.refresh();
    } catch (error) {
      log('Logout error: ' + error, 'error');
    }
  };

  const handlePatientClick = (patientId: string) => {
    log(`Patient ${patientId} clicked`, 'info');
    router.push(`/patients/${patientId}`);
  };

  const handleDeleteClick = async (e: React.MouseEvent, patientId: string) => {
    // Stop event propagation to prevent triggering the parent button's onClick
    e.stopPropagation();
    
    // Set the deleting patient ID to show loading state
    setDeletingPatientId(patientId);
    
    try {
      const response = await fetch(`/api/patients?id=${patientId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete patient');
      }
      
      // Remove the patient from the state
      setPatients(prevPatients => 
        prevPatients.filter(patient => patient._id !== patientId)
      );
    } catch (err) {
      log('Error deleting patient: ' + err, 'error');
      // Could add a toast notification here for error feedback
    } finally {
      setDeletingPatientId(null);
    }
  };

  const handleAddPatient = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setRoomNumber("");
    setDiagnosis("");
    setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!firstName || !lastName || !roomNumber || !diagnosis) {
      setFormError("All fields are required");
      return;
    }
    
    try {
      setSubmitting(true);
      setFormError("");
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          roomNumber,
          diagnosis
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add patient');
      }
      
      const data = await response.json();
      
      // Add the new patient to the state
      if (data.patient) {
        setPatients((prevPatients) => [data.patient, ...prevPatients]);
      }
      
      // Close the modal and reset form
      closeModal();
    } catch (err: any) {
      log('Error adding patient: ' + err, 'error');
      setFormError(err.message || 'Failed to add patient. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white p-4 md:p-6 relative">
      {/* Logout Button (Top Right) */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          onClick={handleLogout}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Logout"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-8 w-8 text-gray-600"
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full pt-16 pb-2">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Patient List</h1>
          <p className="text-gray-500 text-sm md:text-base">
            Enter the patient profile to update information, including names, with voice recording.
          </p>
        </div>

        {/* Patient List Container */}
        <div className="border-2 border-gray-300 rounded-lg p-4 flex-1 mb-4 overflow-hidden">
          {/* Loading and Error States */}
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B52FF]"></div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-center">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            /* Scrollable Patient Tabs */
            <div className="flex flex-col gap-3 h-full overflow-y-auto pr-2">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <div key={patient._id} className="relative">
                    <button
                      onClick={() => handlePatientClick(patient._id)}
                      className="p-4 w-full bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-left shadow-sm transition-all flex items-center"
                    >
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-gray-600">{patient.firstName.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-800">{`${patient.firstName} ${patient.lastName}`}</span>
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(e, patient._id)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Delete ${patient.firstName} ${patient.lastName}`}
                      disabled={deletingPatientId === patient._id}
                    >
                      {deletingPatientId === patient._id ? (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></div>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No patients yet. Add your first patient below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Patient Button - Fixed at bottom */}
        <div className="flex-shrink-0">
          <button
            onClick={handleAddPatient}
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
            Add Patient
          </button>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Patient</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {formError}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      id="roomNumber"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnosis
                    </label>
                    <input
                      type="text"
                      id="diagnosis"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B52FF]"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                      submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#8B52FF] hover:bg-opacity-90'
                    }`}
                  >
                    {submitting ? 'Adding...' : 'Add Patient'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
