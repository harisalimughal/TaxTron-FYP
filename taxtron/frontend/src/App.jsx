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
import Notifications from "./components/notifications";
import FAQ from "./components/FAQ";
import ContactUs from "./components/Contact";
import { AuthProvider } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";



// const ProtectedAdminRoute = ({ children }) => {
//   const token = localStorage.getItem('adminToken');
//   return token ? children : <Navigate to="/admin/login" />;
// };

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
    <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<MetaMaskLogin setAccount={setAccount} />} />
        <Route path="/dashboard" element={account ? <Dashboard account={account} /> : <Navigate to="/" />} />
        <Route path="/register" element={<RegisterVehicle />} />
        <Route path="/view-nft/:inspectionId" element={<NFTPage />} />
        <Route path="/pay-fee/:inspectionId" element={<PayFee />} />
        <Route path="/admin/inspect/" element={<AdminInspect />} />
        <Route path="/notifications/" element={<Notifications />} />
        <Route path="/faqs" element={<FAQ />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}/>
      </Routes>
    </Router>
    </AuthProvider>
  );
};

export default App;
