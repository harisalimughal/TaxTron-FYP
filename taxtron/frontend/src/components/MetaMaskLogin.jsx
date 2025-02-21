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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      {/* MetaMask Logo */}
      <h1>TAXTRON</h1>
      
      {/* Connect Button */}
      <button
        onClick={connectWallet}
        className="flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        <img 
          src="/metamask-fox.svg" 
          alt="MetaMask Icon" 
          className="w-6 h-12 mr-2"
        />
        Continue with MetaMask
      </button>

      {/* Display error message */}
      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MetaMaskLogin;
