import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import { useLocation } from "react-router-dom";
import axios from 'axios';

const VehicleRegistration = () => {
  const location = useLocation();
  const [account, setAccount] = useState(location.state?.account || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectionId, setInspectionId] = useState("");
  const [inspectionSuccess, setInspectionSuccess] = useState(false);
  
  // Available dates and selected date
  const [availableDates, setAvailableDates] = useState([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState("");
  const [appointmentSuccess, setAppointmentSuccess] = useState("");

  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [isBooked, setIsBooked] = useState(false);

  const [vehicleData, setVehicleData] = useState({
    ownerName: '',
    fatherName: '',
    cnic: '',
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    variant: '',
    manufacturingYear: '',
    registrationYear: '',
    vehicleType: '',
    fuelType: ''
  });

 const handleChange = (e) => {
  const { name, value } = e.target;

  if (name === 'cnic') {
    // Allow only numbers and limit to 13 digits
    if (!/^\d*$/.test(value)) return;
    if (value.length > 13) return;
  } else if (name === 'ownerName' || name === 'fatherName') {
    // Allow only alphabets and spaces
    if (!/^[a-zA-Z\s]*$/.test(value)) return;
  }

  setVehicleData({ ...vehicleData, [name]: value });
};


  // Fetch available appointment dates on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Generate a unique inspection ID when component mounts
  useEffect(() => {
    // Create unique ID based on timestamp and random number
    const uniqueId = `INSP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    setInspectionId(uniqueId);
  }, []);

  // Fetch available appointment dates
  const fetchAppointments = async () => {
    setAppointmentLoading(true);
    setAppointmentError("");

    try {
        const response = await axios.get("http://localhost:5000/api/appointments");
        console.log(response);

        // Check if the response data is an empty array
        if (response.data.length === 0 || response.data.every(appointment => appointment.status !== "Free")) {
          setAvailableDates([]);
          setAppointmentError("No Available Dates.")
        } else {
          const freeAppointments = response.data.filter(app => app.status === "Free");
            const formattedAppointments = freeAppointments.map((appointment) => {
            const fullDate = new Date(appointment.scheduledDate);
                
                return {
                    id: appointment._id,
                    date: fullDate.toISOString().split("T")[0], // YYYY-MM-DD
                    time: fullDate.toISOString().split("T")[1].slice(0, 5), // HH:MM
                    status: appointment.status
                };
            });

            setAvailableDates(formattedAppointments);
        }
    } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointmentError("Failed to load appointments.");
        setAvailableDates([]);
    } finally {
        setAppointmentLoading(false);
    }
  };
  
  const bookAppointment = async (id) => {
    setAppointmentLoading(true);
    if (!scheduledDate) {
      setAppointmentError("Please select both date and time.");
      return false;
    }
  
    setAppointmentLoading(true);
    setAppointmentError("");
    setAppointmentSuccess("");
  
    try {
      // Combine date + time into ISO string (e.g., "2025-05-15T10:30:00Z")
      const scheduledDateISO = `${scheduledDate}T${selectedTimeSlot}:00Z`;
      console.log("Booking Data:", scheduledDateISO);

      const response = await axios.put(`http://localhost:5000/api/appointments/${id}/status`, {
        status: 'Booked',
        id: id
      });      
  
      setAppointmentSuccess("Appointment booked successfully!");
      setIsBooked(true);
      return true;
    } catch (error) {
      console.error("Error booking appointment:", error);
      setAppointmentError("Failed to book appointment.");
      return false;
    } finally {
      setAppointmentLoading(false);
    }
  };
  
  // Connect to MetaMask
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        return accounts[0];
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        alert("Error connecting to MetaMask: " + error.message);
      }
    } else {
      alert("Please install MetaMask to use this feature!");
    }
  };

  const submitForInspection = async () => {
    let currentAccount = account;
    
    if (!currentAccount) {
      currentAccount = await connectWallet();
      if (!currentAccount) {
        alert("Please connect MetaMask first!");
        return;
      }
    }

    const selectedAppointment = availableDates.find(
      (item) => item.date === scheduledDate && item.time === selectedTimeSlot
    );
  
    if (!selectedAppointment || !selectedAppointment.id) {
      alert("Invalid appointment selection. Please try again.");
      return;
    }

    // First, book the appointment
    const appointmentBooked = await bookAppointment(selectedAppointment.id);
    if (!appointmentBooked) {
      return; // Exit if appointment booking failed
    }

    setIsSubmitting(true);

    try {
      // Prepare the inspection data
      const inspectionData = {
        inspectionId: inspectionId,
        walletAddress: currentAccount,
        vehicleDetails: {
          ...vehicleData,
          manufacturingYear: parseInt(vehicleData.manufacturingYear) || 0,
          registrationYear: parseInt(vehicleData.registrationYear) || 0
        },
        appointmentDetails: {
          date: scheduledDate,
          time: selectedTimeSlot,
          appointmentId: selectedAppointment.id
        }
      };
      
      // Send the data to the inspection endpoint
      const response = await axios.post("http://localhost:5000/api/inspections", inspectionData);
      
      console.log("Inspection request submitted:", response.data);
      setInspectionSuccess(true);
      
      alert(`Vehicle submitted for inspection successfully! Your inspection ID is ${inspectionId}. Please save this ID for reference. Your appointment is confirmed for ${scheduledDate} at ${selectedTimeSlot}`);
    } catch (error) {
      console.error("Error submitting vehicle for inspection:", error);
      alert("Error submitting vehicle for inspection: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Submit Vehicle for Inspection</h2>
          <div className="flex items-center">
            <button 
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition duration-200"
            >
              {account ? `ConnectedAccount: ${account.substring(0, 6)}...${account.substring(38)}` : "Connect Wallet"}
            </button>
            <button
              className="ml-4 text-blue-400 hover:text-blue-300 transition duration-200"
              onClick={() => window.history.back()}
            >
              &lt; Back
            </button>
          </div>
        </div>

        {inspectionId && (
          <div className="mb-6 bg-blue-900/30 border border-blue-600 rounded-md p-3">
            <p className="text-blue-300 font-medium">Your Inspection ID: <span className="text-white font-bold">{inspectionId}</span></p>
            <p className="text-sm text-gray-300 mt-1">Please save this ID for future reference. You'll need it to check your inspection status.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column - Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-2">Vehicle Information</h3>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Engine Number</label>
              <input 
                type="text" 
                name="engineNumber" 
                value={vehicleData.engineNumber} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Chassis Number</label>
              <input 
                type="text" 
                name="chassisNumber" 
                value={vehicleData.chassisNumber} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Make</label>
              <input 
                type="text" 
                name="make" 
                value={vehicleData.make} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Model</label>
              <input 
                type="text" 
                name="model" 
                value={vehicleData.model} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Variant</label>
              <input 
                type="text" 
                name="variant" 
                value={vehicleData.variant} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Manufacturing Year</label>
              <input 
                type="number" 
                name="manufacturingYear" 
                value={vehicleData.manufacturingYear} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Registration Year</label>
              <input 
                type="number" 
                name="registrationYear" 
                value={vehicleData.registrationYear} 
                onChange={handleChange} 
                className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Vehicle Type</label>
              <div className="relative">
                <select 
                  name="vehicleType" 
                  value={vehicleData.vehicleType} 
                  onChange={handleChange} 
                  className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                  required
                >
                  <option value="">Select type</option>
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                  <option value="bus">Bus</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fuel Type</label>
              <div className="relative">
                <select 
                  name="fuelType" 
                  value={vehicleData.fuelType} 
                  onChange={handleChange} 
                  className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                  required
                >
                  <option value="">Select fuel</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="cng">CNG</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Owner Information & Appointment Booking */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Owner Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Owner Name</label>
                  <input 
                    type="text" 
                    name="ownerName" 
                    value={vehicleData.ownerName} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Father Name</label>
                  <input 
                    type="text" 
                    name="fatherName" 
                    value={vehicleData.fatherName} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CNIC</label>
                  <input 
                    type="text" 
                    name="cnic" 
                    value={vehicleData.cnic} 
                    onChange={handleChange} 
                    className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white" 
                    required 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Schedule Appointment</h3>
              
              <div className="space-y-4">
                
                {appointmentError && (
                  <div className="bg-red-900/50 border border-red-500 text-red-100 p-3 rounded-md text-sm">
                    {appointmentError}
                  </div>
                )}
                
                {appointmentSuccess && (
                  <div className="bg-green-900/50 border border-green-500 text-green-100 p-3 rounded-md text-sm">
                    {appointmentSuccess}
                  </div>
                )}

                {/* Select Appointment Date */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Select Date</label>
                  <div className="relative">
                    <select 
                      value={scheduledDate} 
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                      required
                      disabled={appointmentLoading || availableDates.length === 0}
                    >
                      <option value="">Select a date</option>
                      {availableDates.map((item) => (
                      <option key={`${item.date}-${item.time}`} value={`${item.date}`}>
                        {`${item.date}`} 
                      </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {scheduledDate && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Select Time Slot</label>
                    <select 
                      value={selectedTimeSlot} 
                      onChange={(e) => setSelectedTimeSlot(e.target.value)}
                      
                      className="w-full bg-gray-800 border-b border-blue-500 focus:border-blue-400 outline-none p-2 text-white appearance-none" 
                      required
                      disabled={appointmentLoading || availableDates.length === 0}
                    >
                      <option value="">Select a Time</option>
                      {availableDates.map((item) => (
                      <option key={`${item.date}-${item.time}`} value={item.time}>
                      {`${item.time}`}
                    </option>        
                      ))}
                    </select>
                  </div>
                )}

                {/* Summary */}
                {scheduledDate && selectedTimeSlot && (
                  <div className="mt-4 bg-blue-900/30 border border-blue-600 rounded-md p-3">
                    <h4 className="font-medium text-blue-300 mb-1">Your Selected Appointment</h4>
                    <p className="text-sm text-white">
                      <span className="text-blue-300">Date:</span> {new Date(scheduledDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-white">
                      <span className="text-blue-300">Time:</span> {selectedTimeSlot}
                    </p>
                  </div>
                )}

                {/*  Book Appointment Button */}
                <button 
                  onClick={() => {
                    const selectedSlot = availableDates.find(
                      (item) => item.date === scheduledDate && item.time === selectedTimeSlot
                    );
                    
                    // Check if we found a slot and it has an id property
                    if (selectedSlot) {
                      // Use the id if available, otherwise log an error
                      const appointmentId = selectedSlot.id || selectedSlot._id;
                      if (appointmentId) {
                        bookAppointment(appointmentId);
                      } else {
                        console.error("No appointment ID found for selected slot:", selectedSlot);
                        setAppointmentError("Error: Could not find appointment ID. Please refresh and try again.");
                      }
                    } else {
                      setAppointmentError("This time isn't available. Please select another time slot.");
                    }
                  }}
                  disabled={appointmentLoading || !scheduledDate || !selectedTimeSlot || isBooked}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {appointmentLoading
                    ? "Booking..."
                    : isBooked
                      ? "Booked ✔️"
                      : "Book Appointment"}
                </button>                    
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button 
            onClick={submitForInspection} 
            disabled={isSubmitting || appointmentLoading || !scheduledDate || inspectionSuccess}
            className={`${
              isSubmitting || appointmentLoading || !scheduledDate || inspectionSuccess
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white px-10 py-2 rounded-md font-medium transition duration-200 w-64`}
          >
            {isSubmitting ? 'Processing...' : inspectionSuccess ? 'Submitted for Inspection ✔️' : 'Submit for Inspection'}
          </button>
        </div>
        <div>
          <div className='mb-4 text-center'>
            <a href={'/dashboard'}
            className='inline-block text-sm text-blue-400 hover:underline'
            >
            Go to Dashboard →
            </a>
          </div>
        
       </div>
      </div>
    </div>
  );
};

export default VehicleRegistration;