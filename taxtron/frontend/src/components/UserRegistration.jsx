import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TaxTronLogo from './TaxTronLogo';

const UserRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState({
    cnic: '',
    fullName: '',
    fatherName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Get wallet address from navigation state
    if (location.state?.walletAddress) {
      setWalletAddress(location.state.walletAddress);
    } else {
      // If no wallet address, redirect to landing
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'cnic') {
      // Format CNIC as user types: 35202-1234567-8
      let formatted = value.replace(/\D/g, '');
      if (formatted.length > 0) {
        if (formatted.length <= 5) {
          formatted = formatted;
        } else if (formatted.length <= 12) {
          formatted = formatted.slice(0, 5) + '-' + formatted.slice(5);
        } else {
          formatted = formatted.slice(0, 5) + '-' + formatted.slice(5, 12) + '-' + formatted.slice(12, 13);
        }
      }
      setUserData({ ...userData, [name]: formatted });
    } else if (name === 'phoneNumber') {
      // Format phone number: +92-300-1234567
      let formatted = value.replace(/\D/g, '');
      if (formatted.startsWith('92')) {
        formatted = '+' + formatted;
      } else if (formatted.startsWith('0')) {
        formatted = '+92' + formatted.slice(1);
      } else if (!formatted.startsWith('+92')) {
        formatted = '+92' + formatted;
      }
      setUserData({ ...userData, [name]: formatted });
    } else {
      setUserData({ ...userData, [name]: value });
    }
  };

  const validateStep1 = () => {
    const { cnic, fullName, fatherName } = userData;
    
    if (!/^\d{5}-\d{7}-\d$/.test(cnic)) {
      setError('CNIC must be in format: 35202-1234567-8');
      return false;
    }
    
    if (!/^[a-zA-Z\s]{2,50}$/.test(fullName)) {
      setError('Full name must contain only letters and spaces (2-50 characters)');
      return false;
    }
    
    if (!/^[a-zA-Z\s]{2,50}$/.test(fatherName)) {
      setError('Father name must contain only letters and spaces (2-50 characters)');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const { phoneNumber, email } = userData;
    
    if (!/^(\+92|0)?[0-9]{10}$/.test(phoneNumber)) {
      setError('Phone number must be valid Pakistani format');
      return false;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const validateStep3 = () => {
    const { password, confirmPassword } = userData;
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const nextStep = () => {
    setError('');
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateStep3()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          walletAddress
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Registration successful! You can now register vehicles.');
        // Store token and user data
        localStorage.setItem('userToken', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard', { state: { user: data.data.user } });
        }, 2000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    navigate('/');
  };

  const steps = [
    { number: 1, title: 'Personal Info', description: 'CNIC and Names' },
    { number: 2, title: 'Contact Info', description: 'Phone and Email' },
    { number: 3, title: 'Security', description: 'Password Setup' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <TaxTronLogo size="2xl" showText={false} />
            <button
              onClick={goBack}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl w-full">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step.number 
                      ? 'text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`} style={currentStep >= step.number ? {backgroundColor: '#8CC152'} : {}}>
                    {step.number}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 ml-6 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{backgroundColor: '#8CC152'}}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-600 mb-4">
                Complete your registration to start using TaxTron
              </p>
              <div className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg p-3">
                {walletAddress}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNIC Number *
                    </label>
                    <input
                      type="text"
                      name="cnic"
                      value={userData.cnic}
                      onChange={handleChange}
                      placeholder="35202-1234567-8"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={userData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Father Name *
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={userData.fatherName}
                      onChange={handleChange}
                      placeholder="Enter your father's name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={userData.phoneNumber}
                      onChange={handleChange}
                      placeholder="+92-300-1234567"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={userData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Security */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={userData.password}
                      onChange={handleChange}
                      placeholder="Enter password (min 6 characters)"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={userData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-colors duration-200"
                  style={{'--tw-ring-color': '#8CC152'}}
                  onFocus={(e) => e.target.style.borderColor = '#8CC152'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                    style={{backgroundColor: '#8CC152'}}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login', { state: { walletAddress } })}
                  className="font-medium transition-colors duration-200"
                  style={{color: '#8CC152'}}
                  onMouseEnter={(e) => e.target.style.color = '#7AB142'}
                  onMouseLeave={(e) => e.target.style.color = '#8CC152'}
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
