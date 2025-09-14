import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TaxTronLogo from './TaxTronLogo';

const VehicleRegistration = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [user, setUser] = useState(null);
  const [inspectionId, setInspectionId] = useState('');
  
  // Available dates and selected date
  const [availableDates, setAvailableDates] = useState([]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [appointmentError, setAppointmentError] = useState('');
  const [appointmentSuccess, setAppointmentSuccess] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [isBooked, setIsBooked] = useState(false);
  
  // Edit mode for vehicle details
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalVehicleData, setOriginalVehicleData] = useState({});

  const [vehicleData, setVehicleData] = useState({
    engineNumber: '',
    chassisNumber: '',
    make: '',
    model: '',
    variant: '',
    manufacturingYear: '',
    registrationYear: '',
    vehicleType: '',
    fuelType: '',
    engineCapacity: '',
    color: ''
  });

  // Auto-fetch vehicle details
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Function to fetch vehicle details by chassis number
  const fetchVehicleDetails = async (chassisNumber) => {
    if (!chassisNumber || chassisNumber.length < 10) {
      setFetchError('');
      return;
    }

    setIsFetchingDetails(true);
    setFetchError('');

    try {
      const response = await fetch(`http://localhost:5000/api/vehicle-database/vehicle-details/${chassisNumber}`);
      const data = await response.json();

      if (data.success) {
        // Auto-populate form with fetched data
        // Map vehicleCategory to valid enum values
        const mapVehicleType = (category) => {
          const mapping = {
            'Passenger Vehicle': 'Car',
            'Commercial Vehicle': 'Truck',
            'Motorcycle': 'Motorcycle',
            'Bus': 'Bus',
            'Van': 'Van',
            'SUV': 'SUV'
          };
          return mapping[category] || 'Other';
        };

        setVehicleData(prev => ({
          ...prev,
          chassisNumber: data.data.chassisNumber,
          make: data.data.make,
          model: data.data.model,
          variant: data.data.variant,
          manufacturingYear: data.data.year.toString(),
          registrationYear: data.data.year.toString(), // Set registrationYear same as manufacturingYear
          vehicleType: mapVehicleType(data.data.vehicleCategory),
          fuelType: data.data.fuelType,
          engineCapacity: data.data.engineCapacity.toString(),
          color: data.data.color,
          engineNumber: data.data.engineNumber
        }));
        setFetchError('');
      } else {
        setFetchError(data.message || 'Vehicle not found in database');
      }
    } catch (error) {
      setFetchError('Error fetching vehicle details');
      console.error('Error fetching vehicle details:', error);
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // User is authenticated, proceed with registration
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/');
    }

    // Generate inspection ID
    setInspectionId(`INSP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    
    // Fetch available dates
    fetchAvailableDates();
  }, [navigate]);

  const fetchAvailableDates = async () => {
    setAppointmentLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/appointments/available');
      const data = await response.json();
      
      if (data.success) {
        setAvailableDates(data.data);
      } else {
        setAppointmentError('Failed to fetch available dates');
      }
    } catch (error) {
      setAppointmentError('Error fetching available dates');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'manufacturingYear' || name === 'registrationYear' || name === 'engineCapacity') {
      // Only allow numbers
      if (!/^\d*$/.test(value)) return;
    }
    
    // Clear any existing errors when user starts typing
    if (error) {
      setError('');
    }
    
    setVehicleData({ ...vehicleData, [name]: value });
  };

  const handleDateSelect = (date) => {
    setScheduledDate(date);
    setSelectedTimeSlot('');
    setAppointmentSuccess('');
    setAppointmentError('');
  };

  const handleTimeSlotSelect = (timeSlot) => {
    setSelectedTimeSlot(timeSlot);
  };

  // Edit mode functions
  const toggleEditMode = () => {
    if (!isEditMode) {
      // Entering edit mode - save original data
      setOriginalVehicleData({ ...vehicleData });
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveChanges = () => {
    // Save changes and exit edit mode
    setIsEditMode(false);
    setOriginalVehicleData({});
  };

  const handleCancelEdit = () => {
    // Restore original data and exit edit mode
    setVehicleData({ ...originalVehicleData });
    setIsEditMode(false);
    setOriginalVehicleData({});
  };

  const bookAppointment = async () => {
    if (!scheduledDate || !selectedTimeSlot) {
      setAppointmentError('Please select both date and time slot');
      return;
    }

    setAppointmentLoading(true);
    setAppointmentError('');

    try {
      const response = await fetch('http://localhost:5000/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          date: scheduledDate,
          timeSlot: selectedTimeSlot,
          inspectionId: inspectionId
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppointmentSuccess('Appointment booked successfully!');
        setIsBooked(true);
        setAppointmentError('');
      } else {
        setAppointmentError(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      setAppointmentError('Error booking appointment: ' + error.message);
    } finally {
      setAppointmentLoading(false);
    }
  };

  // Clear messages when user starts interacting
  const clearMessages = () => {
    if (error) setError('');
    if (success) setSuccess('');
    if (showSuccessAnimation) setShowSuccessAnimation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!isBooked) {
      setError('Please book an appointment first');
      return;
    }

    if (!vehicleData.chassisNumber) {
      setError('Please enter a chassis number to fetch vehicle details');
      return;
    }

    if (!vehicleData.make || !vehicleData.model) {
      setError('Vehicle details not found. Please check the chassis number and try again.');
      return;
    }

    if (!vehicleData.color || vehicleData.color.trim() === '') {
      setError('Please enter the current color of your vehicle.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/vehicles/inspection-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          vehicleDetails: vehicleData,
          appointmentDetails: {
            date: scheduledDate,
            time: selectedTimeSlot,
            appointmentId: inspectionId
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear any previous errors
        setError('');
        
        // Show success message and animation
        setShowSuccessAnimation(true);
        setSuccess('Your vehicle registration request has been submitted successfully! Inspection ID: ' + (data.data?.inspectionId || 'Generated'));
        
        // Reset form
        setVehicleData({
          engineNumber: '',
          chassisNumber: '',
          make: '',
          model: '',
          variant: '',
          manufacturingYear: '',
          registrationYear: '',
          vehicleType: '',
          fuelType: '',
          engineCapacity: '',
          color: ''
        });
        setIsBooked(false);
        setScheduledDate('');
        setSelectedTimeSlot('');
        setAppointmentSuccess('');
        
        // Hide animation and success message after 5 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setSuccess('');
        }, 5000);
      } else {
        // Clear any previous success states
        setSuccess('');
        setShowSuccessAnimation(false);
        setError(data.message || 'Registration failed. Please check your information and try again.');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <TaxTronLogo size="2xl" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Registration</h1>
          <p className="text-gray-600 mb-4">
            Register a new vehicle using your account
          </p>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 max-w-md mx-auto">
            <div className="text-sm text-gray-500">Account Details</div>
            <div className="font-semibold text-gray-900">{user.fullName}</div>
            <div className="text-sm text-gray-600">CNIC: {user.cnic}</div>
            <div className="text-xs text-gray-500 font-mono">{user.walletAddress}</div>
          </div>
        </div>

        {/* Back Arrow */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Information</h2>
            
            {/* Chassis Number Input */}
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Vehicle Chassis Number *
                <span className="text-xs text-gray-500 ml-2">(All details will be auto-fetched)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="chassisNumber"
                  value={vehicleData.chassisNumber}
                  onChange={(e) => {
                    handleChange(e);
                    clearMessages(); // Clear any previous messages
                    // Auto-fetch details when chassis number is entered
                    if (e.target.value.length >= 10) {
                      fetchVehicleDetails(e.target.value);
                    }
                  }}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200 pr-12 text-center text-lg"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  placeholder="Enter chassis number (e.g., JHMFA1F80AS123456)"
                  required
                />
                {isFetchingDetails && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                  </div>
                )}
              </div>
              {fetchError && (
                <p className="text-red-500 text-sm mt-2 text-center">{fetchError}</p>
              )}
              {!fetchError && vehicleData.make && (
                <p className="text-green-600 text-sm mt-2 text-center">
                  ✓ Vehicle details fetched successfully!
                </p>
              )}
            </div>

            {/* Vehicle Details Display */}
            {vehicleData.make && (
              <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Vehicle Details
                  </h3>
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {isEditMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 text-center mb-6">
                  {isEditMode 
                    ? 'Edit mode enabled - You can modify any field below' 
                    : 'All details are auto-fetched from the database. Click Edit to modify any field.'
                  }
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Make */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Make *</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="make"
                        value={vehicleData.make}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.make}</p>
                    )}
                  </div>

                  {/* Model */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Model *</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="model"
                        value={vehicleData.model}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.model}</p>
                    )}
                  </div>

                  {/* Variant */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Variant</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="variant"
                        value={vehicleData.variant}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.variant}</p>
                    )}
                  </div>

                  {/* Manufacturing Year */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year *</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="manufacturingYear"
                        value={vehicleData.manufacturingYear}
                        onChange={handleChange}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.manufacturingYear}</p>
                    )}
                  </div>

                  {/* Engine Number */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engine *</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="engineNumber"
                        value={vehicleData.engineNumber}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.engineNumber}</p>
                    )}
                  </div>

                  {/* Chassis Number */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chassis *</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="chassisNumber"
                        value={vehicleData.chassisNumber}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold font-mono"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 font-mono text-sm">{vehicleData.chassisNumber}</p>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fuel Type *</label>
                    {isEditMode ? (
                      <select
                        name="fuelType"
                        value={vehicleData.fuelType}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      >
                        <option value="">Select fuel type</option>
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.fuelType}</p>
                    )}
                  </div>

                  {/* Engine Capacity */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Engine Capacity *</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        name="engineCapacity"
                        value={vehicleData.engineCapacity}
                        onChange={handleChange}
                        min="0"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.engineCapacity} CC</p>
                    )}
                  </div>

                  {/* Color */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Color *</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        name="color"
                        value={vehicleData.color}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-colors duration-200 text-lg font-semibold"
                        style={{'--tw-ring-color': '#8CC152'}}
                        onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                        onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                        placeholder="Enter current vehicle color"
                        required
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900">{vehicleData.color}</p>
                    )}
                  </div>
                </div>

                {/* Edit Mode Action Buttons */}
                {isEditMode && (
                  <div className="flex justify-center space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      className="px-6 py-2 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                      style={{backgroundColor: '#8CC152'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appointment Booking */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Schedule Inspection Appointment</h2>
            
            {!isBooked ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Date
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        type="button"
                        onClick={() => handleDateSelect(date)}
                        className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                          scheduledDate === date
                            ? 'text-white shadow-lg transform scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                        }`}
                        style={scheduledDate === date ? {backgroundColor: '#8CC152'} : {}}
                      >
                        {new Date(date).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                </div>

                {scheduledDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Time Slot
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTimeSlotSelect(time)}
                          className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selectedTimeSlot === time
                              ? 'text-white shadow-lg transform scale-105'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                          }`}
                          style={selectedTimeSlot === time ? {backgroundColor: '#8CC152'} : {}}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {scheduledDate && selectedTimeSlot && (
                  <button
                    type="button"
                    onClick={bookAppointment}
                    disabled={appointmentLoading}
                    className="w-full md:w-auto px-8 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    style={{backgroundColor: '#8CC152'}}
                    onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#7AB142')}
                    onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#8CC152')}
                  >
                    {appointmentLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Booking...
                      </div>
                    ) : (
                      'Book Appointment'
                    )}
                  </button>
                )}

                {appointmentError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <div className="flex">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm">{appointmentError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {appointmentSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    <div className="flex">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div className="ml-3">
                        <p className="text-sm font-semibold">Appointment Booked Successfully!</p>
                        <p className="text-sm">Date: {new Date(scheduledDate).toLocaleDateString()}</p>
                        <p className="text-sm">Time: {selectedTimeSlot}</p>
                        <p className="text-sm">Inspection ID: {inspectionId}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl">
                <div className="flex">
                  <svg className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="font-semibold">Appointment Booked Successfully!</p>
                    <p>Date: {new Date(scheduledDate).toLocaleDateString()}</p>
                    <p>Time: {selectedTimeSlot}</p>
                    <p className="text-sm font-mono">Inspection ID: {inspectionId}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button Section with Messages */}
          <div className="space-y-4">
            {/* Success Message */}
            {(showSuccessAnimation || success) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-fade-in shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-green-800">Registration Submitted Successfully!</h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>{success || 'Your vehicle registration request has been submitted. You will receive an email confirmation shortly.'}</p>
                    </div>
                    <div className="mt-3 text-xs text-green-600">
                      <p>✓ Form submitted • ✓ Appointment booked • ✓ Email notification sent</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message (if any during submission) */}
            {error && !showSuccessAnimation && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Registration Failed</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !isBooked}
                className="px-12 py-4 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                style={{backgroundColor: '#8CC152'}}
                onMouseEnter={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#7AB142')}
                onMouseLeave={(e) => !e.target.disabled && (e.target.style.backgroundColor = '#8CC152')}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting Registration...
                  </div>
                ) : showSuccessAnimation ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-pulse">
                      <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-2">Registration Submitted!</span>
                  </div>
                ) : (
                  'Submit Registration Request'
                )}
              </button>
            </div>

            {/* Helper Text */}
            {!isBooked && (
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Please book an appointment before submitting your registration
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehicleRegistration;
