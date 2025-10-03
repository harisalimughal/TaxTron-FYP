import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  // Date carousel state
  const [dateCarouselIndex, setDateCarouselIndex] = useState(0);

  // Ensure carousel index stays within bounds
  const handleCarouselIndexChange = (newIndex) => {
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      setDateCarouselIndex(0);
      return;
    }

    const maxIndex = Math.max(0, availableDates.length - 5);
    setDateCarouselIndex(Math.max(0, Math.min(maxIndex, newIndex)));
  };
  
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
            'SUV': 'SUV',
            'Car': 'Car',
            'Truck': 'Truck',
            'Two Wheeler': 'Motorcycle',
            'Four Wheeler': 'Car',
            'Heavy Vehicle': 'Truck',
            'Light Commercial Vehicle': 'Van',
            'Heavy Commercial Vehicle': 'Truck',
            'Passenger Car': 'Car',
            'Commercial Truck': 'Truck',
            'Motor Bike': 'Motorcycle',
            'Scooter': 'Motorcycle'
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

      if (data.success && Array.isArray(data.data)) {
        // Filter out any malformed date objects and ensure proper structure
        const validDates = data.data.filter(dateObj => {
          return dateObj &&
                 typeof dateObj === 'object' &&
                 dateObj.date &&
                 Array.isArray(dateObj.availableTimeSlots) &&
                 dateObj.availableTimeSlots.length > 0;
        });

        console.log('Valid available dates:', validDates);
        setAvailableDates(validDates);
      } else {
        console.error('Invalid API response format:', data);
        setAppointmentError('Failed to fetch available dates - invalid response format');
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setAppointmentError('Error fetching available dates: ' + error.message);
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

  const handleDateSelect = (dateObj) => {
    // dateObj is now an object with {date, availableTimeSlots}
    setScheduledDate(dateObj.date);
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 lg:py-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Registration</h1>
                <p className="text-sm text-gray-600">Register a new vehicle using your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Information</h2>
            
            {/* Chassis Number Input */}
            <div className="max-w-md mx-auto text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Vehicle Chassis Number
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
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 shadow-sm hover:border-gray-300 text-center font-mono tracking-wider"
                  style={{
                    '--tw-ring-color': '#10B981',
                    backgroundColor: '#FAFAFA'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10B981';
                    e.target.style.backgroundColor = '#FFFFFF';
                    e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E5E7EB';
                    e.target.style.backgroundColor = '#FAFAFA';
                    e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  }}
                  placeholder="(e.g., JHMFA1F80AS123456)"
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

          {/* Appointment Booking - Modern Design */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md p-4 border border-gray-100 relative z-auto">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-100 to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-blue-100 to-transparent rounded-full transform -translate-x-6 translate-y-6"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm mb-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Schedule Appointment</h2>
                <p className="text-xs text-gray-600">Choose date and time</p>
              </div>

              {!isBooked ? (
                <div className="space-y-4">
                  {/* Step 1: Date Selection - Horizontal Carousel */}
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center mb-3">
                      <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold mr-2">1</div>
                      <h3 className="text-sm font-semibold text-gray-900">Select Date</h3>
                    </div>

                    {availableDates.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-lg font-medium text-gray-900 mb-2">No dates available</p>
                        <p className="text-gray-600">All appointment slots are currently booked.</p>
                      </div>
                    ) : (
                      <>
                          {/* Horizontal Date Carousel */}
                        <div className="relative">
                          {/* Left Navigation Button */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCarouselIndexChange(dateCarouselIndex - 1);
                            }}
                            disabled={dateCarouselIndex === 0}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>

                          {/* Date Carousel Container */}
                          <div className="overflow-hidden px-12">
                            <div
                              className="flex transition-transform duration-300 ease-in-out"
                              style={{
                                transform: `translateX(-${(Math.min(dateCarouselIndex, Math.max(0, availableDates.length - 5)) * 100) / 5}%)`,
                                width: `${Math.max(100, (availableDates.length / 5) * 100)}%`
                              }}
                            >
                              {/* Single row with all dates */}
                              <div className="flex w-full">
                                {availableDates.map((dateObj, index) => {
                                  // Ensure dateObj is valid before rendering
                                  if (!dateObj || !dateObj.date) {
                                    console.warn('Invalid date object:', dateObj);
                                    return null;
                                  }

                                  return (
                                    <button
                                      key={dateObj.date}
                                      type="button"
                                      onClick={() => handleDateSelect(dateObj)}
                                      className={`group relative flex-1 mx-1 p-3 rounded-lg text-xs font-medium transition-all duration-200 transform hover:scale-105 ${
                                        scheduledDate === dateObj.date
                                          ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md scale-105'
                                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-transparent hover:border-green-200'
                                      }`}
                                    >
                                      <div className="text-center">
                                        <div className={`text-xs mb-1 ${scheduledDate === dateObj.date ? 'text-green-100' : 'text-gray-500'}`}>
                                          {(() => {
                                            try {
                                              return new Date(dateObj.date).toLocaleDateString('en-US', { weekday: 'short' });
                                            } catch (e) {
                                              console.error('Error parsing date:', dateObj.date, e);
                                              return 'Invalid';
                                            }
                                          })()}
                                        </div>
                                        <div className={`text-lg font-bold ${scheduledDate === dateObj.date ? 'text-white' : 'text-gray-900'}`}>
                                          {(() => {
                                            try {
                                              return new Date(dateObj.date).getDate();
                                            } catch (e) {
                                              console.error('Error parsing date:', dateObj.date, e);
                                              return '??';
                                            }
                                          })()}
                                        </div>
                                        <div className={`text-xs ${scheduledDate === dateObj.date ? 'text-green-100' : 'text-gray-500'}`}>
                                          {(() => {
                                            try {
                                              return new Date(dateObj.date).toLocaleDateString('en-US', { month: 'short' });
                                            } catch (e) {
                                              console.error('Error parsing date:', dateObj.date, e);
                                              return 'Date';
                                            }
                                          })()}
                                        </div>
                                      </div>
                                      {scheduledDate === dateObj.date && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                                          <svg className="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Right Navigation Button */}
                          <button
                            type="button"
                            onClick={() => {
                              handleCarouselIndexChange(dateCarouselIndex + 1);
                            }}
                            disabled={dateCarouselIndex >= Math.max(0, availableDates.length - 5)}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Carousel Indicators - Limited to 5 dots */}
                        <div className="flex justify-center mt-3 space-x-1">
                          {Array.from({ length: Math.min(5, Math.max(1, Math.max(0, availableDates.length - 4))) }, (_, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleCarouselIndexChange(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                dateCarouselIndex === index
                                  ? 'bg-green-500 w-6'
                                  : 'bg-gray-300 hover:bg-gray-400'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Step 2: Time Selection */}
                  {scheduledDate && (
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-fade-in">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-semibold mr-2">2</div>
                        <h3 className="text-sm font-semibold text-gray-900">Select Time Slot</h3>
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5">
                        {(() => {
                          // Find the selected date object to get available time slots
                          const selectedDateObj = availableDates.find(d => d && d.date === scheduledDate);
                          const availableTimeSlots = selectedDateObj ? selectedDateObj.availableTimeSlots : [];

                          if (!Array.isArray(availableTimeSlots)) {
                            console.error('Invalid time slots data:', availableTimeSlots);
                            return (
                              <div className="col-span-full text-center text-red-500 text-sm">
                                Error loading time slots
                              </div>
                            );
                          }

                          return ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'].map((time) => {
                            const isAvailable = availableTimeSlots.includes(time);
                            return (
                              <button
                                key={time}
                                type="button"
                                onClick={() => isAvailable && handleTimeSlotSelect(time)}
                                disabled={!isAvailable}
                                className={`group relative p-2 rounded-md text-xs font-medium transition-all duration-200 transform ${
                                  selectedTimeSlot === time
                                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm scale-105'
                                    : isAvailable
                                      ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-transparent hover:border-blue-200 hover:scale-105 cursor-pointer'
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <div className="text-center">
                                  <div className={`text-sm font-bold ${selectedTimeSlot === time ? 'text-white' : isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {time}
                                  </div>
                                </div>
                                {selectedTimeSlot === time && (
                                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full flex items-center justify-center">
                                    <svg className="w-1.5 h-1.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Confirmation & Booking */}
                  {scheduledDate && selectedTimeSlot && (
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3 border border-green-200 animate-fade-in">
                      <div className="flex items-center mb-2">
                        <div className="flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full text-xs font-semibold mr-2">3</div>
                        <h3 className="text-sm font-semibold text-gray-900">Confirm Appointment</h3>
                      </div>

                      <div className="bg-white rounded-md p-2 mb-2 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-md flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900">
                                {new Date(scheduledDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-600">at {selectedTimeSlot}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">ID</div>
                            <div className="font-mono text-xs font-semibold text-gray-900">
                              {inspectionId.substring(0, 6)}...
                            </div>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={bookAppointment}
                        disabled={appointmentLoading}
                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-3 rounded-md transition-all duration-200 transform hover:scale-105 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xs"
                      >
                        {appointmentLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Confirming...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirm Appointment
                          </div>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Error Messages */}
                  {appointmentError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-2 animate-fade-in">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <h3 className="text-xs font-medium text-red-800">Booking Failed</h3>
                          <div className="mt-1 text-xs text-red-700">
                            <p>{appointmentError}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success Messages */}
                  {appointmentSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-2 animate-fade-in">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <h3 className="text-xs font-medium text-green-800">Appointment Booked!</h3>
                          <div className="mt-1 text-xs text-green-700">
                            <p className="font-semibold">Date: {new Date(scheduledDate).toLocaleDateString()}</p>
                            <p>Time: {selectedTimeSlot}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Appointment Booked State */
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full shadow-sm mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Appointment Confirmed!</h3>
                  <p className="text-xs text-gray-600 mb-3">
                    Your inspection has been scheduled
                  </p>

                  <div className="bg-white rounded-md p-3 shadow-sm border border-gray-100 max-w-xs mx-auto">
                    <div className="space-y-1.5 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(scheduledDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="font-semibold text-gray-900">{selectedTimeSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono text-xs font-semibold text-gray-900">
                          {inspectionId}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
