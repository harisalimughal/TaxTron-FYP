// import React, { useState } from 'react';
// import Web3 from 'web3';
// import { useNavigate } from "react-router-dom";

// const MetaMaskLogin = ({ setAccount }) => { // Receive setAccount from parent
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const connectWallet = async () => {
//     try {
//       if (typeof window.ethereum !== 'undefined') {
//         // Request account access
//         const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//         setAccount(accounts[0]); // Update the account in the parent component
//         navigate("/dashboard");
//         setError('');
//       } else {
//         setError('Please install MetaMask!');
//       }
//     } catch (err) {
//       setError('Failed to connect to MetaMask');
//       console.error(err);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
//       {/* MetaMask Logo */}
//       <h1>TAXTRON</h1>
      
//       {/* Connect Button */}
//       <button
//         onClick={connectWallet}
//         className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
//       >
//         <img 
//           src="/metamask-fox.svg" 
//           alt="MetaMask Icon" 
//           className="w-6 h-12 mr-2"
//         />
//         Continue with MetaMask
//       </button>

//       {/* Display error message */}
//       {error && (
//         <p className="mt-4 text-red-600">{error}</p>
//       )}
//     </div>
//   );
// };

// export default MetaMaskLogin;


//-------------------------------------------------------------------------------------




import React, { useState } from 'react';
import Web3 from 'web3';
import { useNavigate } from "react-router-dom";

const MetaMaskLogin = ({ setAccount }) => { // Receive setAccount from parent
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]); // Update the account in the parent component
        navigate("/dashboard");
        setError('');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect to MetaMask');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">      
      {/* Logo */}
      <h1 className="text-6xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
        TaxTron
      </h1>
      
      {/* Choose Authentication Method */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-white text-xl font-semibold mb-8 text-center">
          Choose Authentication Method
        </h2>
        
        {/* New User System */}
        <div className="space-y-4 mb-6">
          <h3 className="text-gray-300 text-sm font-medium">Recommended: Secure User System</h3>
          
          <button
            onClick={() => navigate('/user/register')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-4 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <span className="font-medium ml-4">Create Account</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>

          <button
            onClick={() => navigate('/user/login')}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
              </div>
              <span className="font-medium ml-4">Sign In</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-600"></div>
          <span className="px-3 text-gray-400 text-sm">OR</span>
          <div className="flex-1 border-t border-gray-600"></div>
        </div>

        {/* Legacy MetaMask System */}
        <div className="space-y-4">
          <h3 className="text-gray-300 text-sm font-medium">Legacy: Direct MetaMask</h3>
          
          <button
            onClick={connectWallet}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-4 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <img 
                  src="/metamask-fox.svg" 
                  alt="MetaMask Icon" 
                  className="w-8 h-8"
                />
              </div>
              <span className="font-medium ml-4">MetaMask Only</span>
            </div>
            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </button>
        </div>
        
        {/* Help text */}
        <p className="text-gray-400 text-xs text-center mt-6">
          New users should create an account for better security and features.
        </p>
      </div>
      
      {/* Display error message */}
      {error && (
        <p className="mt-4 text-red-500">{error}</p>
      )}
    </div>
  );
};

export default MetaMaskLogin;