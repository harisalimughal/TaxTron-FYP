import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import web3 from "./utils/web3";
import MetaMaskLogin from "./components/MetaMaskLogin";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import RegisterVehicle from "./components/RegisterVehicle";
import AdminInspect from './components/AdminInspect';
import NFTPage from './components/NftPage';
import PayFee from './components/fee';



const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" />;
};

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
        
        <Route path="/" element={<MetaMaskLogin setAccount={setAccount} />} />
        <Route path="/dashboard" element={account ? <Dashboard account={account} /> : <Navigate to="/" />} />
        <Route path="/register" element={<RegisterVehicle />} />
        <Route path="/view-nft/:inspectionId" element={<NFTPage />} />
        <Route path="/pay-fee/:inspectionId" element={<PayFee />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />  } />
        <Route path="/admin/inspect/" element={<AdminInspect />} />
      </Routes>
    </Router>
  );
};

export default App;
