import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import web3 from "./utils/web3";
import LandingPage from "./components/LandingPage";
import MetaMaskLogin from "./components/MetaMaskLogin";
import Dashboard from "./components/Dashboard";
import RegisterVehicle from "./components/RegisterVehicle";

const App = () => {
  const [account, setAccount] = useState("");

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]); // Set account if connected
      }
    };

    checkMetaMaskConnection();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage account={account} />} />
        <Route path="/login" element={<MetaMaskLogin setAccount={setAccount} />} />
        <Route path="/dashboard" element={account ? <Dashboard account={account} /> : <Navigate to="/login" />} />
        <Route path="/register" element={<RegisterVehicle />} />
      </Routes>
    </Router>
  );
};

export default App;
