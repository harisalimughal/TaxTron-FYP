import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TaxTronLogo from './TaxTronLogo';

const Landing = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Connect Wallet, 2: Check User, 3: Login/Signup
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [userExists, setUserExists] = useState(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window.ethereum !== 'undefined';

  const connectWallet = async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setStep(2);
        checkUserExists(accounts[0]);
      }
    } catch (error) {
      if (error.code === 4001) {
        setError('Please connect your wallet to continue.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const checkUserExists = async (address) => {
    setIsCheckingUser(true);
    try {
      const response = await fetch(`http://localhost:5000/api/users/check-wallet/${address}`);
      const data = await response.json();
      
      if (data.success) {
        setUserExists(data.exists);
        setStep(3);
      } else {
        setError('Failed to check user status. Please try again.');
        setStep(1);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      setStep(1);
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleLogin = () => {
    navigate('/login', { state: { walletAddress } });
  };

  const handleSignup = () => {
    navigate('/register', { state: { walletAddress } });
  };

  const resetFlow = () => {
    setStep(1);
    setWalletAddress('');
    setUserExists(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <TaxTronLogo size="3xl" showText={false} />
            <div className="text-sm text-gray-600">
              Blockchain Vehicle Registration & Taxation
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`} style={step >= stepNumber ? {backgroundColor: '#8CC152'} : {}}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-12 h-0.5 ml-4 ${
                      step > stepNumber ? '' : 'bg-gray-200'
                    }`} style={step > stepNumber ? {backgroundColor: '#8CC152'} : {}} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Connect Wallet</span>
              <span>Check Account</span>
              <span>Sign In/Up</span>
            </div>
          </div>

          {/* Step 1: Connect Wallet */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <img 
                    src="/metamask-fox.svg" 
                    alt="MetaMask" 
                    className="w-10 h-10"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Connect Your Wallet
                </h1>
                <p className="text-gray-600 mb-8">
                  Connect your MetaMask wallet to get started with TaxTron
                </p>

                {!isMetaMaskInstalled ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          MetaMask Not Installed
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Please install MetaMask browser extension to continue.</p>
                          <a 
                            href="https://metamask.io/download/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium underline hover:text-red-600"
                          >
                            Download MetaMask →
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{backgroundColor: '#8CC152'}}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
          >
                    {isConnecting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Connecting...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <img src="/metamask-fox.svg" alt="MetaMask" className="w-6 h-6 mr-3" />
                        Connect MetaMask
                      </div>
                    )}
                  </button>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
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
              </div>
            </div>
          )}

          {/* Step 2: Checking User */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Checking Your Account
                </h1>
                <p className="text-gray-600 mb-6">
                  Verifying if you have an existing account with this wallet
                </p>
                <div className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg p-3 mb-6">
                  {walletAddress}
                </div>
                
                {isCheckingUser && (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-600">Checking...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Login or Signup */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{backgroundColor: '#8CC152'}}>
                  {userExists ? (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {userExists ? 'Welcome Back!' : 'Create Your Account'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {userExists 
                    ? 'Your wallet is already registered. Please sign in to continue.'
                    : 'Complete your registration to start using TaxTron.'
                  }
                </p>
                
                <div className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg p-3 mb-6">
                  {walletAddress}
                </div>

                <div className="space-y-3">
                  {userExists ? (
                    <button
                      onClick={handleLogin}
                      className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                      style={{backgroundColor: '#8CC152'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
                    >
                      Sign In
                    </button>
                  ) : (
                    <button
                      onClick={handleSignup}
                      className="w-full text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                      style={{backgroundColor: '#8CC152'}}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#7AB142'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#8CC152'}
                    >
                      Create Account
                    </button>
                  )}
                  
                  <button
                    onClick={resetFlow}
                    className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-6 rounded-xl transition-colors duration-200"
                  >
                    Use Different Wallet
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>© 2024 TaxTron. Secure blockchain-based vehicle registration and taxation.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
