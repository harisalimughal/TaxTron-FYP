import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import web3 from "./utils/web3";
import SplashScreen from "./components/SplashScreen";
import MetaMaskLogin from "./components/MetaMaskLogin";
import Landing from "./components/Landing";
import AdminLogin from "./components/AdminLogin";
import UserRegistration from "./components/UserRegistration";
import Dashboard from "./components/Dashboard";
import AdminDashboard from "./components/AdminDashboard";
import VehicleRegistration from "./components/VehicleRegistration";
import UserLogin from "./components/UserLogin";
import AdminInspect from './components/AdminInspect';
import NFTPage from './components/NftPage';
import PayFee from './components/fee';
import Notifications from "./components/notifications";
import FAQ from "./components/FAQ";
import ContactUs from "./components/Contact";
import { AuthProvider, useAuth } from "./context/authContext";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnershipHistory from "./components/OwnershipHistory";
import TaxPayment from "./components/TaxPayment";
import OwnershipTransfer from "./components/OwnershipTransfer";
import UserInspections from "./components/UserInspections";
import AdminTaxManagement from "./components/AdminTaxManagement";
import AdminTransferManagement from "./components/AdminTransferManagement";
import MyVehicles from "./components/MyVehicles";

// Create a separate component for routes that uses auth context
const AppRoutes = () => {
  const [account, setAccount] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const checkMetaMaskConnection = async () => {
      const accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]); // Set account if connected
      }
    };

    checkMetaMaskConnection();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <Routes>
      {/* Landing Page with Step-by-Step Flow */}
      <Route path="/" element={<Landing />} />
      
      {/* User Authentication Routes */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegistration />} />
      
      {/* Vehicle Registration (requires user authentication only) */}
      <Route path="/vehicle/register" element={<VehicleRegistration />} />
      
      {/* Legacy routes (for backward compatibility) */}
      <Route path="/legacy" element={<MetaMaskLogin setAccount={setAccount} />} />
      <Route path="/legacy/dashboard" element={account ? <Dashboard account={account} /> : <Navigate to="/" />} />
      
      {/* Main dashboard (will check for user authentication) */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/vehicles" element={<MyVehicles />} />
      
      {/* Other routes */}
      <Route path="/ownership-history" element={<OwnershipHistory />} />
      <Route path="/ownership-history/:vehicleId" element={<OwnershipHistory />} />
      <Route path="/ownership-transfer" element={<OwnershipTransfer/>}/>
      <Route path="/tax-payment" element={<TaxPayment/>} />
      <Route path="/view-nft/:inspectionId" element={<NFTPage />} />
      <Route path="/pay-fee/:inspectionId" element={<PayFee />} />
      <Route path="/inspections" element={<UserInspections />} />
      <Route path="/admin/inspect/" element={<AdminInspect />} />
      <Route path="/notifications/" element={<Notifications />} />
      <Route path="/faqs" element={<FAQ />} />
      <Route path="/contact" element={<ContactUs />} />
      
      {/* Admin routes with proper authentication */}
      <Route 
        path="/admin/login" 
        element={isLoggedIn ? <Navigate to="/admin/dashboard" /> : <AdminLogin />} 
      />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/tax-management" 
        element={
          <ProtectedRoute>
            <AdminTaxManagement />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/transfer-management" 
        element={
          <ProtectedRoute>
            <AdminTransferManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;