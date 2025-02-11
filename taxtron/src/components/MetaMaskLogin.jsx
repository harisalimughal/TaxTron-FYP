import React, { useState } from 'react';
import Web3 from 'web3';

const MetaMaskLogin = () => {
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const web3 = new Web3(window.ethereum);
        setAccount(accounts[0]);
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

      {/* Display connected account or error */}
      {account && (
        <p className="mt-4 text-green-600">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}
      {error && (
        <p className="mt-4 text-red-600">{error}</p>
      )}
    </div>
  );
};

export default MetaMaskLogin;