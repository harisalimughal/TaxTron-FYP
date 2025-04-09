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
      
      {/* Connect Card */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md flex flex-col items-center">
        <h2 className="text-white text-xl font-semibold mb-8 text-center">
          Connect your<br />wallet
        </h2>
        
        {/* MetaMask Button */}
        <button
          onClick={connectWallet}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 mb-6 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center ">
            <img 
          src="/metamask-fox.svg" 
          alt="MetaMask Icon" 
          className="w-12 h-12 mr-2"
        />
            </div>
            <span className="font-medium ml-4">MetaMask</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
        
        {/* Help text */}
        <p className="text-gray-400 text-xs text-center">
          Don't have a wallet? <a href="#" className="text-blue-400 hover:underline">Get started here.</a>
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