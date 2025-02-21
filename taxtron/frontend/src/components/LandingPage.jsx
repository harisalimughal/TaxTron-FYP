import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";

const LandingPage = () => {
  const [account, setAccount] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMetaMask = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          const accounts = await web3.eth.getAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        } catch (error) {
          console.error("Error checking MetaMask account:", error);
        }
      }
    };
    checkMetaMask();
  }, []);

  const handleNavigation = () => {
    if (account) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl mb-4">Welcome to TaxTron</h1>
      <p>A blockchain Based Vehicle Registration and Taxation System</p>
      <button onClick={handleNavigation} className="bg-blue-500 text-white px-6 py-3 rounded-lg">
        {account ? "Go to Dashboard" : "Connect MetaMask"}
      </button>
    </div>
  );
};

export default LandingPage;
