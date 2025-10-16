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

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalVehicleData, setOriginalVehicleData] = useState({});

  // Ensure carousel index stays within bounds
  const handleCarouselIndexChange = (newIndex) => {
    if (!Array.isArray(availableDates) || availableDates.length === 0) {
      setDateCarouselIndex(0);
      return;
    }

    const maxIndex = Math.max(0, availableDates.length - 5);
    setDateCarouselIndex(Math.max(0, Math.min(maxIndex, newIndex)));
  };
  
  // Registration mode toggle
  const [registrationMode, setRegistrationMode] = useState('manual'); // 'manual' or 'auto'
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
        {/* Registration Mode Toggle */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose Registration Method</h2>
            <p className="text-sm text-gray-600">Select how you'd like to register your vehicle</p>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative inline-flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setRegistrationMode('manual')}
                className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  registrationMode === 'manual'
                    ? 'bg-green-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Manual Entry</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRegistrationMode('auto')}
                className={`relative px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  registrationMode === 'auto'
                    ? 'bg-green-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Auto-Fetch Details</span>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className={`text-sm transition-all duration-200 ${
              registrationMode === 'manual'
                ? 'text-blue-600 font-medium'
                : 'text-gray-500'
            }`}>
              {registrationMode === 'manual'
                ? 'Fill out all vehicle details manually'
                : 'Enter chassis number to auto-fetch vehicle details from database'
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Information</h2>

            {registrationMode === 'manual' ? (
              /* Manual Entry Mode - Show all form fields */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Make <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="make"
                      value={vehicleData.make}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Honda, Toyota, BMW"
                      required
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="model"
                      value={vehicleData.model}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Civic, Corolla, 3 Series"
                      required
                    />
                  </div>

                  {/* Variant */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Variant
                    </label>
                    <input
                      type="text"
                      name="variant"
                      value={vehicleData.variant}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., 1.8L VTi Oriel, Altis Grande"
                    />
                  </div>

                  {/* Manufacturing Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Year <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="manufacturingYear"
                      value={vehicleData.manufacturingYear}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., 2023"
                      required
                    />
                  </div>

                  {/* Engine Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engine Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="engineNumber"
                      value={vehicleData.engineNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 font-mono"
                      placeholder="e.g., R18A1-123456"
                      required
                    />
                  </div>

                  {/* Chassis Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chassis Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="chassisNumber"
                      value={vehicleData.chassisNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200 font-mono"
                      placeholder="e.g., JHMFA1F80AS123456"
                      required
                    />
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuel Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fuelType"
                      value={vehicleData.fuelType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
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
                  </div>

                  {/* Engine Capacity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engine Capacity (CC) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="engineCapacity"
                      value={vehicleData.engineCapacity}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., 1798"
                      required
                    />
                  </div>

                  {/* Color */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Color <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={vehicleData.color}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g., Pearl White, Super White, Alpine White"
                      required
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Manual Entry Mode</h4>
                      <div className="mt-1 text-sm text-blue-700">
                        <p>Fill out all the vehicle details manually. Make sure all information is accurate as it will be used for registration.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Auto-Fetch Mode - Show chassis number input only */
              <>
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

                {/* Vehicle Details Display (Auto-fetched) */}
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

                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800">Auto-Fetch Mode</h4>
                          <div className="mt-1 text-sm text-green-700">
                            <p>Vehicle details have been automatically fetched from the database using the chassis number. You can edit any field if needed.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Appointment Booking - Calendar Style */}
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a time to book</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pakistan, Islamabad (GMT+5)
                </div>
              </div>
            </div>

            {!isBooked ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Calendar Section */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const year = currentMonth.getFullYear();
                        const month = currentMonth.getMonth();
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const days = [];
                        
                        // Empty cells for days before month starts
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} className="p-2"></div>);
                        }
                        
                        // Days of the month
                        for (let day = 1; day <= daysInMonth; day++) {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isAvailable = availableDates.some(d => d.date === dateStr);
                          const isSelected = scheduledDate === dateStr;
                          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                          
                          days.push(
                            <button
                              key={day}
                              type="button"
                              onClick={() => isAvailable && handleDateSelect(availableDates.find(d => d.date === dateStr))}
                              disabled={!isAvailable}
                              className={`w-10 h-10 text-sm font-medium rounded-full transition-all flex items-center justify-center ${
                                isSelected
                                  ? 'bg-green-500 text-white shadow-md'
                                  : isAvailable
                                    ? 'hover:bg-green-100 text-green-600 cursor-pointer hover:shadow-sm'
                                    : 'text-gray-300 cursor-not-allowed'
                              } ${isToday && !isSelected ? 'bg-green-50 text-green-600 font-bold border border-green-200' : ''}`}
                            >
                              {day}
                            </button>
                          );
                        }
                        
                        return days;
                      })()}
                    </div>
                  </div>
                </div>
                
                {/* Time Slots Section */}
                <div className="lg:col-span-1">
                  {scheduledDate ? (
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-3">
                        {new Date(scheduledDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <div className="space-y-2">
                        {['9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM', '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM'].map((time) => {
                          const selectedDateObj = availableDates.find(d => d.date === scheduledDate);
                          const isAvailable = selectedDateObj?.availableTimeSlots?.includes(time) || true;
                          const isSelected = selectedTimeSlot === time;
                          
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => isAvailable && handleTimeSlotSelect(time)}
                              disabled={!isAvailable}
                              className={`w-full p-2.5 text-left rounded-lg border transition-all text-sm ${
                                isSelected
                                  ? 'bg-green-500 text-white border-green-500'
                                  : isAvailable
                                    ? 'bg-white hover:bg-gray-50 border-gray-200 hover:border-green-300'
                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                      
                      {selectedTimeSlot && (
                        <button
                          type="button"
                          onClick={bookAppointment}
                          disabled={appointmentLoading}
                          className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
                        >
                          {appointmentLoading ? 'Booking...' : 'Book Appointment'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="text-sm">Select a date to see available times</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Appointment Booked State */
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h3>
                <p className="text-gray-600 mb-4">Your inspection has been scheduled</p>
                
                <div className="bg-gray-50 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold">
                        {scheduledDate && new Date(scheduledDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-semibold">{selectedTimeSlot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">{inspectionId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error and Success Messages */}
            {appointmentError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Booking Failed</h4>
                    <p className="text-sm text-red-700 mt-1">{appointmentError}</p>
                  </div>
                </div>
              </div>
            )}
            
            {appointmentSuccess && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Appointment Booked!</h4>
                    <p className="text-sm text-green-700 mt-1">{appointmentSuccess}</p>
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
